import type {
    CKEditor5Type,
    WangEditorType,
    CodeMirrorElementType
} from './types';

export function handleDiscuz(url: string): boolean {
    const Discuz = document.getElementById("fastpostmessage") as HTMLTextAreaElement | HTMLInputElement | null;
    const Discuz_Interactive_reply = document.getElementById("postmessage") as HTMLTextAreaElement | HTMLInputElement | null;
    const Discuz_Advanced = document.getElementById("e_textarea");

    if (Discuz_Interactive_reply) {
        //回复楼层
        Discuz_Interactive_reply.value += '[img]' + url + '[/img]';
        return true;
    } else if (Discuz) {
        //回复楼主
        Discuz.value += '[img]' + url + '[/img]';
        return true;
    }

    if (Discuz_Advanced && Discuz_Advanced.parentNode) {
        //高级回复
        let Discuz_Advanced_iframe: HTMLIFrameElement | null;
        try {
            Discuz_Advanced_iframe = Discuz_Advanced.parentNode.querySelector("iframe") as HTMLIFrameElement | null;
            if (Discuz_Advanced_iframe && Discuz_Advanced_iframe.contentDocument) {
                let bodyElement = Discuz_Advanced_iframe.contentDocument.body;
                let img = document.createElement('img');
                img.src = url;
                bodyElement.appendChild(img);
                return true;
            }
            else {
                (Discuz_Advanced as HTMLTextAreaElement | HTMLInputElement).value += '[img]' + url + '[/img]';
                return true;
            }
        } catch (error) {
            return false;
        }
    }
    return false;
}

export function handleCodeMirror5(url: string): boolean {
    let editorElement = document.querySelector(".CodeMirror") as CodeMirrorElementType | null;
    if (editorElement && editorElement.CodeMirror) {
        const content = editorElement.CodeMirror.getValue();
        const newContent = content + `![image](${url})`;
        editorElement.CodeMirror.setValue(newContent);
        return true;
    }
    return false;
}

export function handleCodeMirror6(url: string): boolean {
    let CodeMirror6 = document.querySelector(".cm-content");
    if (CodeMirror6) {
        let item = document.createElement('div');
        item.className = "cm-line";
        item.dir = "auto";
        item.innerText = '![' + "image" + '](' + url + ')';
        CodeMirror6.appendChild(item);
        return true;
    }
    return false;
}

export function handleV2ex(url: string): boolean {
    // 1. 尝试处理发帖场景 (CodeMirror5)
    // V2EX 发帖页面通常使用 CodeMirror5，如果有 .CodeMirror 元素，优先尝试使用 CodeMirror5 的处理逻辑
    if (document.querySelector(".CodeMirror")) {
        if (handleCodeMirror5(url)) {
            return true;
        }
    }

    // 2. 处理回帖场景 (普通文本框)
    const reply_content = document.getElementById("reply_content") as HTMLTextAreaElement | HTMLInputElement | null;
    if (reply_content) {
        // V2EX 回帖通常支持 Markdown 或纯文本，直接追加 URL
        // 确保前有空格，避免粘连
        const prefix = reply_content.value ? '\n' : '';
        reply_content.value += `${prefix}${url}`;
        
        // 触发 input 事件以通知页面数据更新（针对某些响应式框架或验证逻辑）
        const inputEvent = new Event('input', { bubbles: true });
        reply_content.dispatchEvent(inputEvent);
        return true;
    }

    return false;
}

export function handleHalo(url: string): boolean {
    let HaloEditor_Element = document.querySelector('.ProseMirror') as HTMLElement;
    if (HaloEditor_Element) {
        HaloEditor_Element.focus();
        document.execCommand('insertImage', false, url);
        return true;
    }
    return false;
}

export function handleLowEndTalk(url: string): boolean {
    const lowendtalkEditor = document.getElementById("Form_Body") as HTMLInputElement;
    if (lowendtalkEditor) {
        lowendtalkEditor.value += '![' + "图片" + '](' + url + ')';
        return true;
    }
    return false;
}

export function handleTypecho(url: string): boolean {
    let text = document.getElementById("text") as HTMLTextAreaElement | HTMLInputElement | null;
    if (text) {
        text.value += '![' + "image" + '](' + url + ')';
        let inputEvent = new Event('input', { bubbles: true });
        text.dispatchEvent(inputEvent);
        return true;
    }
    return false;
}

export function handlePHPBB(url: string): boolean {
    let phpbbForum = document.getElementById("phpbb");
    if (phpbbForum) {
        window.postMessage({ type: 'phpbbForum', data: '[img]' + url + '[/img]' }, '*');
        return true;
    }
    return false;
}

export function handleGutenberg(url: string): boolean {
    try {
        const Gutenberg = window.wp?.data.dispatch('core/block-editor');
        if (Gutenberg) {
            const imageBlock = window.wp?.blocks.createBlock('core/image', { url: url });
            Gutenberg.insertBlock(imageBlock);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

export function handleTinyMCE(url: string): boolean {
    try {
        let TinyMCE = window.tinymce?.activeEditor;
        if (TinyMCE) {
            TinyMCE.execCommand('mceInsertContent', false, url);
            window.postMessage({ type: 'TinyMCEResponse', status: 'success', data: 'true' }, '*');
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

export function handleWangEditor(url: string): boolean {
    try {
        const editor = window.editor as WangEditorType | undefined;
        // Check if it matches WangEditor signature
        if (editor && typeof editor.getEditableContainer === 'function') {
             const wangeditor_Element = editor.getEditableContainer();
             if (wangeditor_Element) {
                editor.dangerouslyInsertHtml(url);
                return true;
             }
        }
        return false;
    } catch (error) {
        return false;
    }
}

export function handleCKEditor4(url: string): boolean {
    try {
        const ckeditor4 = window.CKEDITOR?.instances?.ckdemoarticle;
        if (ckeditor4) {
            ckeditor4.insertHtml(url);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

export function handleCKEditor5(url: string): boolean {
    try {
        const editor = window.editor as CKEditor5Type | undefined;
        // Check if it matches CKEditor5 signature
        if (editor && typeof editor.getData === 'function' && typeof editor.setData === 'function') {
            const content = editor.getData();
            editor.setData(content + url);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

export function handleUEditor(url: string): boolean {
    try {
        const UE = window.UE;
        let ueditor_Element = UE?.getEditor("editor_content");
        if (ueditor_Element) {
            ueditor_Element.execCommand('insertimage', {
                src: url,
            });
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}
