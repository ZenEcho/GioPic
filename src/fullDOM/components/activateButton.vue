<template>
  <n-button class="giopic_activateButton" type="success" size="small" @click="activate">
    {{ t('app_name') }}
  </n-button>

</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue';


const show = ref(false);
const { t } = useI18n()


function activate() {
  show.value = !show.value

}

onMounted(() => {
  
});
</script>

<style>
img {
  box-shadow: none !important;
  border: none !important;
}



.PL-v2exImgMark::before {
  position: absolute;
  bottom: 0px;
  right: 0;
  content: "❤️";
  font-size: 12px;
  line-height: 12px;
  color: red;
}

.PL-ImgMark {
  width: 100%;
}

.PL-ImgMark::before {
  position: absolute;
  top: 0px;
  left: 0px;
  content: "❤️";
  font-size: 12px;
  line-height: 12px;
  color: red;
}

.position-relative {
  position: relative;
}
</style>