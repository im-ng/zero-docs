<style type="text/css">
  img-comparison-slider {
    --divider-width: 5px;
    --divider-color: #131212ff;
    --default-handle-opacity: 0.9;
  }
</style>

<script setup>
import { ImgComparisonSlider } from '@img-comparison-slider/vue';
</script>

# Module Attribution

<ImgComparisonSlider>
<!-- eslint-disable -->
<img
    slot="first"
    style="width: 100%"
    src="./public/zero-fmk-x-ray-1.webp"
/>
<img
    slot="second"
    style="width: 100%"
    src="./public/zero-fmk-x-ray-2.webp"
/>
<!-- eslint-enable -->
</ImgComparisonSlider>

_Use this image slider to switch between the module's underlying author and framework building elements. This seemed like a fun and great way to at least honor them._