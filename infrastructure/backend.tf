# ECR Repository for Docker images
resource "aws_ecr_repository" "backend" {
  provider = aws.main
  name     = "getout-backend"

  image_scanning_configuration {
    scan_on_push = true
  }

  image_tag_mutability = "MUTABLE"

  lifecycle {
    prevent_destroy = false
  }
}

# VPC for ECS (using default VPC for simplicity)
data "aws_vpc" "default" {
  provider = aws.main
  default  = true
}

data "aws_subnets" "default" {
  provider = aws.main
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Security Group for ALB
resource "aws_security_group" "alb" {
  provider    = aws.main
  name        = "getout-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "getout-alb-sg"
  }
}

# Security Group for ECS Tasks
resource "aws_security_group" "ecs_tasks" {
  provider    = aws.main
  name        = "getout-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "getout-ecs-tasks-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "backend" {
  provider           = aws.main
  name               = "getout-backend-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids

  tags = {
    Name = "getout-backend-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "backend" {
  provider    = aws.main
  name        = "getout-backend-tg"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  deregistration_delay = 30

  tags = {
    Name = "getout-backend-tg"
  }
}

# ALB Listener (HTTP)
resource "aws_lb_listener" "backend_http" {
  provider          = aws.main
  load_balancer_arn = aws_lb.backend.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  provider = aws.main
  name     = "getout-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "getout-cluster"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution" {
  provider = aws.main
  name     = "getout-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  provider   = aws.main
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_secrets" {
  provider = aws.main
  name     = "getout-ecs-secrets-policy"
  role     = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task" {
  provider = aws.main
  name     = "getout-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "backend" {
  provider          = aws.main
  name              = "/ecs/getout-backend"
  retention_in_days = 7

  tags = {
    Name = "getout-backend-logs"
  }
}

# Secrets Manager for environment variables
resource "aws_secretsmanager_secret" "backend_env" {
  provider = aws.main
  name     = "getout-backend-env"

  tags = {
    Name = "getout-backend-env"
  }
}

resource "aws_secretsmanager_secret_version" "backend_env" {
  provider  = aws.main
  secret_id = aws_secretsmanager_secret.backend_env.id
  secret_string = jsonencode({
    NODE_ENV                      = "production"
    PORT                          = "4000"
    MONGODB_URI                   = var.mongodb_uri
    STRAVA_CLIENT_ID              = var.strava_client_id
    STRAVA_CLIENT_SECRET          = var.strava_client_secret
    STRAVA_WEBHOOK_VERIFY_TOKEN   = var.strava_webhook_verify_token
    JWT_SECRET                    = var.jwt_secret
    FRONTEND_URL                  = "https://${var.domain_name}"
    BACKEND_URL                   = "http://${aws_lb.backend.dns_name}"
    AWS_REGION                    = var.aws_region
  })
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  provider                 = aws.main
  family                   = "getout-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 4000
          hostPort      = 4000
          protocol      = "tcp"
        }
      ]

      secrets = [
        {
          name      = "NODE_ENV"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:NODE_ENV::"
        },
        {
          name      = "PORT"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:PORT::"
        },
        {
          name      = "MONGODB_URI"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:MONGODB_URI::"
        },
        {
          name      = "STRAVA_CLIENT_ID"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:STRAVA_CLIENT_ID::"
        },
        {
          name      = "STRAVA_CLIENT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:STRAVA_CLIENT_SECRET::"
        },
        {
          name      = "STRAVA_WEBHOOK_VERIFY_TOKEN"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:STRAVA_WEBHOOK_VERIFY_TOKEN::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:JWT_SECRET::"
        },
        {
          name      = "FRONTEND_URL"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:FRONTEND_URL::"
        },
        {
          name      = "BACKEND_URL"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:BACKEND_URL::"
        },
        {
          name      = "AWS_REGION"
          valueFrom = "${aws_secretsmanager_secret.backend_env.arn}:AWS_REGION::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:4000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "getout-backend-task"
  }
}

# ECS Service
resource "aws_ecs_service" "backend" {
  provider        = aws.main
  name            = "getout-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 4000
  }

  depends_on = [
    aws_lb_listener.backend_http,
    aws_iam_role_policy_attachment.ecs_task_execution
  ]

  tags = {
    Name = "getout-backend-service"
  }
}
