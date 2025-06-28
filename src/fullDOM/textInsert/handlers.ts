import type { DetectedType, DetectionResult } from '../types';
import {
    handleDiscuz,
    handleHalo,
    handleTypecho,
    handlePHPBB,
    handleV2ex,
    handleLowEndTalk,
    handleCodeMirror5,
    handleCodeMirror6,
    handleGutenberg,
    handleTinyMCE,
    handleWangEditor,
    handleCKEditor4,
    handleCKEditor5,
    handleUEditor,
} from './editorType';
// window.addEventListener('message', (event: MessageEvent) => {
//     if (event.data.type === 'giopic_textInsert') {

//     }
// });


export function textInsertHandler(editorTypes: DetectionResult[]) {
    const editorType = editorTypes[0].type;
    // 延迟5秒运行
    // handleEditorType(editorType, 'https://baidu.com/').then((result) => {});
}

// 处理编辑器类型
export function handleEditorType(editorType: DetectedType, url: string) {
    const editorHandlers: Partial<Record<DetectedType, () => Promise<boolean>>> = {
        Discuz: () => Promise.resolve(handleDiscuz(url)),
        Halo: () => Promise.resolve(handleHalo(url)),
        Typecho: () => Promise.resolve(handleTypecho(url)),
        phpBB: () => Promise.resolve(handlePHPBB(url)),
        V2EX: () => Promise.resolve(handleV2ex(url)),
        nodeseek: () => Promise.resolve(handleCodeMirror5(url)),
        lowendtalk: () => Promise.resolve(handleLowEndTalk(url)),
        CodeMirror5: () => Promise.resolve(handleCodeMirror5(url)),
        CodeMirror6: () => Promise.resolve(handleCodeMirror6(url)),
        GutenbergEditor: () => Promise.resolve(handleGutenberg(url)),
        TinyMCE: () => Promise.resolve(handleTinyMCE(url)),
        wangEditor: () => Promise.resolve(handleWangEditor(url)),
        CKEditor4: () => Promise.resolve(handleCKEditor4(url)),
        CKEditor5: () => Promise.resolve(handleCKEditor5(url)),
        UEditor: () => Promise.resolve(handleUEditor(url)),
    };

    let handler = editorHandlers[editorType];
    if (handler) {
        return handler();
    } else {
        return Promise.resolve(false);
    }
}
