import { createApp } from 'vue'
import buttomView from './components/activateButton.vue'
import { placeContainerInEditor } from './insertEditor/handlers'
import { textInsertHandler, handleEditorType } from './textInsert/handlers'

import 'virtual:uno.css'
import i18n from '@/locales';
const container = document.createElement('div')
container.style.display = 'inline-block'
container.style.width = 'auto'
container.style.zIndex = '999999'

// 加载buttom组件
function loadButtomComponent() {
    const app = createApp(buttomView)
    app.use(i18n);
    app.mount(container)
    placeContainerInEditor(container).then((editorTypes) => {
        console.log(editorTypes);
        // textInsertHandler(editorTypes)

        // window.postMessage({ type: 'stickerPageLoad', id: 'giopic_activateButton' }, '*'); // 贴纸加载开始

        // 监听postmessage事件
        window.addEventListener('message', (event: MessageEvent) => {
            if (event.data.type === 'giopic_textInsert') {
                const editorType = editorTypes[0].type;
                handleEditorType(editorType, event.data.data).then((result) => { });
            }
        });
    })

}



(function () {
    loadButtomComponent()

    window.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type === 'giopic_textInsert') {

        }
    });
    console.log('dom script loaded');
})()

