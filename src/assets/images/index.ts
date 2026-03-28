/**
 * Central image registry — swap any image by changing only the import here.
 * All components pull from this file, so no code changes are needed elsewhere.
 */

import karolProfile1 from "./karol-profile-1.jpg";
import karolProfile2 from "./karol-profile-2.jpg";

/** Avatar / Links page profile photo */
export const avatarImage = karolProfile1;

/** Hero section on /site */
export const heroImage = karolProfile2;
