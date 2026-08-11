/**
 * Site footer (§6.3) — required on every public route.
 *
 * All data comes from SiteSettings and Team; nothing is duplicated per route.
 * Contact details resolve from `contactPeople` because no verified general
 * inbox exists in the audit material and none may be invented (§16.1).
 * The year is computed, never hard-coded (§31.14).
 */

import Link from "next/link";
import { getContactPeople, getSiteSettings, teamContactChannels } from "@/content";
import { resolvePolicyContext } from "@/content/context";
import { mailtoHref, telHref } from "@/lib/security/url";
import { Container } from "@/components/ui";
import { FoundryLogo } from "./FoundryLogo";
import { LinkedInIcon } from "./icons";
import styles from "./site-footer.module.css";

export async function SiteFooter() {
  const policy = await resolvePolicyContext();
  const settings = await getSiteSettings(policy);
  const contactPeople = await getContactPeople(policy);
  const year = new Date().getFullYear();

  const generalEmail = mailtoHref(settings.contactEmail);
  const generalPhone = telHref(settings.contactPhone);

  return (
    <footer className={styles.footer} data-surface="dark">
      <Container>
        <div className={styles.top}>
          <div className={styles.brand}>
            <FoundryLogo variant="white" size="footer" title={settings.displayBrandName} href="/" />
            {settings.brandStatement ? (
              <p className={styles.statement}>{settings.brandStatement.value}</p>
            ) : null}
          </div>

          <nav className={styles.nav} aria-label="Footer">
            <h2 className="visually-hidden">Site</h2>
            <ul className={styles.navList}>
              {settings.footerNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.navLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.contact}>
            <h2 className={styles.contactHeading}>Contact</h2>
            <ul className={styles.contactList}>
              {generalEmail ? (
                <li>
                  <a href={generalEmail} className={styles.contactLink}>
                    {settings.contactEmail}
                  </a>
                </li>
              ) : null}
              {generalPhone ? (
                <li>
                  <a href={generalPhone} className={styles.contactLink}>
                    {settings.contactPhone}
                  </a>
                </li>
              ) : null}

              {contactPeople.map((person) => {
                const channels = teamContactChannels(person, policy);
                const email = mailtoHref(channels.email);
                const phone = telHref(channels.phone);
                if (!email && !phone) return null;
                return (
                  <li key={person.id} className={styles.person}>
                    <span className={styles.personName}>
                      {person.name}
                      <span className={styles.personRole}>{person.role}</span>
                    </span>
                    {email ? (
                      <a href={email} className={styles.contactLink}>
                        {/* Descriptive link text, never a bare icon (§10.3). */}
                        Email {person.name.split(" ")[0]}
                        <span className="visually-hidden">: {channels.email}</span>
                      </a>
                    ) : null}
                    {phone ? (
                      <a href={phone} className={styles.contactLink}>
                        Call {person.name.split(" ")[0]}
                        <span className="visually-hidden">: {channels.phone}</span>
                      </a>
                    ) : null}
                  </li>
                );
              })}

              <li>
                <a
                  href={settings.linkedinUrl}
                  className={styles.contactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkedInIcon size={16} />
                  <span>LinkedIn</span>
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>

            {settings.address ? (
              <address className={styles.address}>
                {settings.legalName ? <span>{settings.legalName}</span> : null}
                {settings.address.streetAddress ? (
                  <span>{settings.address.streetAddress}</span>
                ) : null}
                <span>
                  {[settings.address.postalCode, settings.address.addressLocality]
                    .filter(Boolean)
                    .join(" ")}
                </span>
                {settings.address.addressCountry ? (
                  <span>{settings.address.addressCountry}</span>
                ) : null}
                {settings.organizationNumber ? (
                  <span>Org. no. {settings.organizationNumber}</span>
                ) : null}
              </address>
            ) : null}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {year} {settings.displayBrandName}
          </p>
          {settings.legalNavigation.length > 0 ? (
            <ul className={styles.legalList}>
              {settings.legalNavigation.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={styles.legalLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
