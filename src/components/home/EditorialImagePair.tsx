/**
 * Editorial image pair (§7.4).
 *
 * The two offering images — brutalist architecture and the dark silhouette —
 * with a deliberate asymmetric overlap. This is an explicit override of the
 * prototype's plain two-column grid: the overlap is what gives the block its
 * editorial weight, and it is expressed with grid placement rather than absolute
 * positioning so nothing can escape the container or clip at small widths.
 */

import type { ImageAsset } from "@/content/types";
import { canRenderImage, type PolicyContext } from "@/content/policy";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./editorial-image-pair.module.css";

export type EditorialImagePairProps = {
  images: ImageAsset[];
  policy: PolicyContext;
};

export function EditorialImagePair({ images, policy }: EditorialImagePairProps) {
  // Only rights-cleared, present binaries participate. A missing original does
  // not fall back to a caption card here: this block is pure art direction, and
  // a lone typographic panel would read as an error (§16.7, §19.4.1).
  const renderable = images.filter((image) => canRenderImage(image, policy));
  if (renderable.length === 0) return null;

  const [primary, secondary] = renderable;

  return (
    <div className={styles.pair} data-count={renderable.length}>
      <Reveal className={styles.primary}>
        <ResponsiveImage
          image={primary}
          policy={policy}
          alt=""
          sizes="(min-width: 992px) 46vw, (min-width: 768px) 60vw, 100vw"
          frameClassName={styles.primaryFrame}
        />
      </Reveal>

      {secondary ? (
        <Reveal className={styles.secondary} delay={120}>
          <ResponsiveImage
            image={secondary}
            policy={policy}
            alt=""
            sizes="(min-width: 992px) 38vw, (min-width: 768px) 50vw, 72vw"
            frameClassName={styles.secondaryFrame}
          />
        </Reveal>
      ) : null}
    </div>
  );
}
