import type { CodeMirrorElementType, wpElementType, TinyMCEType, wangEditorType, CKEditor4Type, CKEditor5Type, UEType } from '../types';

export function handleDiscuz(url: string): boolean {
    const Discuz = document.getElementById("fastpostmessage") as HTMLTextAreaElement | HTMLInputElement | null
    const Discuz_Interactive_reply = document.getElementById("postmessage") as HTMLTextAreaElement | HTMLInputElement | null
    const Discuz_Advanced = document.getElementById("e_textarea")
    if (Discuz_Interactive_reply) {
        //回复楼层
        Discuz_Interactive_reply.value += '[img]' + url + '[/img]'
        return true;
    } else if (Discuz) {
        //回复楼主
        Discuz.value += '[img]' + url + '[/img]'
        return true;
    }
    if (Discuz_Advanced && Discuz_Advanced.parentNode) {
        //高级回复
        let Discuz_Advanced_iframe: HTMLIFrameElement | null
        try {
            Discuz_Advanced_iframe = Discuz_Advanced.parentNode.querySelector("iframe") as HTMLIFrameElement | null
            if (Discuz_Advanced_iframe && Discuz_Advanced_iframe.contentDocument) {
                let bodyElement = Discuz_Advanced_iframe.contentDocument.body
                let img = document.createElement('img')
                img.src = url
                bodyElement.appendChild(img)
                return true;
            }
            else {
                (Discuz_Advanced as HTMLTextAreaElement | HTMLInputElement).value += '[img]' + url + '[/img]'
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
    if (editorElement) {
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
        item.className = "cm-line"
        item.dir = "auto"
        item.innerText = '![' + "image" + '](' + url + ')'
        CodeMirror6.appendChild(item)
        return true;
    }
    return false;
}
export function handleV2ex(url: string): boolean {
    // 发帖
    const reply_content_Advanced = document.getElementById("topic_content") as HTMLTextAreaElement | HTMLInputElement | null;
    if (reply_content_Advanced && (reply_content_Advanced as HTMLInputElement).type !== "hidden") {
        reply_content_Advanced.value += '![' + "image" + '](' + url + ')';
        const inputEvent = new Event('input', { bubbles: true });
        reply_content_Advanced.dispatchEvent(inputEvent);
        return true;
    }

    // 回帖
    const reply_content = document.getElementById("reply_content") as HTMLTextAreaElement | HTMLInputElement | null;
    if (reply_content) {
        reply_content.value += url;
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
    let text = document.getElementById("text") as HTMLTextAreaElement | HTMLInputElement | null
    if (text) {
        text.value += '![' + "image" + '](' + url + ')'
        let inputEvent = new Event('input', { bubbles: true });
        text.dispatchEvent(inputEvent);
        return true;
    }
    return false;
}
export function handlePHPBB(url: string): boolean {
    let phpbbForum = document.getElementById("phpbb")
    if (phpbbForum) {
        window.postMessage({ type: 'phpbbForum', data: '[img]' + url + '[/img]' }, '*');
        return true;
    }
    return false;
}
export function handleGutenberg(url: string): boolean {
    try {
        const Gutenberg = (window as { wp?: wpElementType }).wp?.data.dispatch('core/block-editor');
        if (Gutenberg) {
            const imageBlock = (window as { wp?: wpElementType }).wp?.blocks.createBlock('core/image', { url: url });
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
        let TinyMCE = (window as { tinymce?: TinyMCEType }).tinymce?.activeEditor;
        if (TinyMCE) {
            (window as { tinymce?: TinyMCEType }).tinymce?.activeEditor?.execCommand('mceInsertContent', false, url);
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
        let wangeditor_Element = (window as { editor?: wangEditorType }).editor?.getEditableContainer()
        if (wangeditor_Element) {
            (window as { editor?: wangEditorType }).editor?.dangerouslyInsertHtml(url)
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}
export function handleCKEditor4(url: string): boolean {
    try {
        const ckeditor4 = (window as { CKEDITOR?: CKEditor4Type }).CKEDITOR?.instances?.ckdemoarticle;
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
        const editor = (window as { editor?: CKEditor5Type }).editor;
        if (editor) {
            const content = editor?.getData();
            editor?.setData(content + url);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}
export function handleUEditor(url: string): boolean {
    try {
        const UE = (window as { UE?: UEType }).UE;
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