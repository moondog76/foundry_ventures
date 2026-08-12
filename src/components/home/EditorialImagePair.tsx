/**
 * Editorial image pair (§7.4).
 *
 * The two offering images — brutalist architecture and the dark silhouette —
 * with a deliberate asymmetric overlap. This is an explicit override of the
 * prototype's plain two-column grid: the overlap is what gives the block its
 * editorial weight, and it is expressed with grid placement rather than absolute
 * positioning so nothing can escape the container or clip at small widths.
 *
 * Both images drift with the pointer and the scroll, on the same motion rules as
 * the hero's ocean loop. The movement happens *inside* each frame, so the
 * overlap the composition depends on never shifts.
 */

import type { ImageAsset } from "@/content/types";
import { canRenderImage, type PolicyContext } from "@/content/policy";
import { Reveal } from "@/components/ui/Reveal";
import { ParallaxImage } from "./ParallaxImage";
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
        <ParallaxImage
          image={primary}
          policy={policy}
          sizes="(min-width: 992px) 46vw, (min-width: 768px) 60vw, 100vw"
          className={styles.primaryFrame}
        />
      </Reveal>

      {secondary ? (
        <Reveal className={styles.secondary} delay={120}>
          <ParallaxImage
            image={secondary}
            policy={policy}
            sizes="(min-width: 992px) 38vw, (min-width: 768px) 50vw, 72vw"
            className={styles.secondaryFrame}
          />
        </Reveal>
      ) : null}
    </div>
  );
}
