/**
 * Site header (§6.1).
 *
 * Server component: it resolves navigation from SiteSettings (already filtered
 * by feature flag, so a disabled route can never render as dead navigation) and
 * renders both logo variants so the transparent→solid transition never flashes.
 */

import { getSiteSettings } from "@/content";
import { FoundryLogo } from "./FoundryLogo";
import { HeaderShell } from "./HeaderShell";

export async function SiteHeader() {
  const settings = await getSiteSettings();

  return (
    <HeaderShell
      navItems={settings.navigation}
      linkedinUrl={settings.linkedinUrl}
      brandName={settings.displayBrandName}
      logoOnDark={
        <FoundryLogo
          variant="white"
          size="headerLarge"
          title={settings.displayBrandName}
          priority
        />
      }
      logoOnLight={
        <FoundryLogo variant="blue" size="headerLarge" title={settings.displayBrandName} />
      }
      logoCompactOnDark={
        <FoundryLogo variant="white" size="headerCompact" title={settings.displayBrandName} />
      }
      logoCompactOnLight={
        <FoundryLogo variant="blue" size="headerCompact" title={settings.displayBrandName} />
      }
      logoMobileOnDark={
        <FoundryLogo variant="white" size="mobile" title={settings.displayBrandName} />
      }
      logoMobileOnLight={
        <FoundryLogo variant="blue" size="mobile" title={settings.displayBrandName} />
      }
    />
  );
}
