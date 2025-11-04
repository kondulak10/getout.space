/**
 * Font Awesome library configuration
 * Import commonly used icons here to optimize bundle size
 */

import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faUser,
	faMap,
	faHouse,
	faCog,
	faSignOut,
	faTrash,
	faPlus,
	faMinus,
	faCheck,
	faTimes,
	faSpinner,
	faChevronLeft,
	faChevronRight,
	faChevronUp,
	faChevronDown,
	faBars,
	faCircle,
	faSquare,
	faHeart,
	faStar,
	faLocationDot,
	faSwords,
} from '@fortawesome/pro-solid-svg-icons';

import {
	faUser as faUserRegular,
	faHeart as faHeartRegular,
	faStar as faStarRegular,
} from '@fortawesome/pro-regular-svg-icons';

import {
	faUser as faUserLight,
} from '@fortawesome/pro-light-svg-icons';

// Add icons to the library
library.add(
	// Solid icons
	faUser,
	faMap,
	faHouse,
	faCog,
	faSignOut,
	faTrash,
	faPlus,
	faMinus,
	faCheck,
	faTimes,
	faSpinner,
	faChevronLeft,
	faChevronRight,
	faChevronUp,
	faChevronDown,
	faBars,
	faCircle,
	faSquare,
	faHeart,
	faStar,
	faLocationDot,
	faSwords,
	// Regular icons
	faUserRegular,
	faHeartRegular,
	faStarRegular,
	// Light icons
	faUserLight,
);
