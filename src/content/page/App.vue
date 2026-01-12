<script setup lang="ts">
import { Detector } from './EditorInjector';

// 启动注入监听
Detector.startListening();

function toggleHighlight() {
  document.body?.classList.toggle('giopic-page-highlight')
}
</script>

