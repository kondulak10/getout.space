variable "domain_name" {
  description = "The domain name for the website (e.g., getout.space)"
  type        = string
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Backend variables
variable "mongodb_uri" {
  description = "MongoDB connection URI"
  type        = string
  sensitive   = true
}

variable "strava_client_id" {
  description = "Strava OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "strava_client_secret" {
  description = "Strava OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "strava_webhook_verify_token" {
  description = "Strava Webhook Verification Token"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT Secret for authentication"
  type        = string
  sensitive   = true
}
