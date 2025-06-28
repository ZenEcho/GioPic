import type { HandlerFunction, TinyMCEType, wangEditorType, CKEditor4Type, CKEditor5Type, UEType, DetectionResult } from '../types';
import { Detector } from './detectors';

// 在编辑器中插入容器的处理函数
const editorInsertHandlers: Record<string, HandlerFunction> = {
    Discuz: (result, container) => {
        const DiscuzReply = document.getElementById("fastpostmessage")
        const Discuz_ReplyAdvanced = document.getElementById("e_textarea")
        try {
            if (DiscuzReply) {
                let fastpostsubmit = document.getElementById("fastpostsubmit")
                fastpostsubmit?.parentNode?.appendChild(container as HTMLElement)
            }
            if (Discuz_ReplyAdvanced) {
                Discuz_ReplyAdvanced?.parentNode?.parentNode?.appendChild(container as HTMLElement)
            }
        } catch (error) {
            console.error("Failed to append container:", error);
        }
        convertDiscuzUrlToImage() // url转图片
    },
    Halo: (result, container) => {
        const HaloEditorElement = document.getElementsByClassName("halo-rich-text-editor")
        const HaloEditorHeader = HaloEditorElement[0].querySelector('.editor-header');
        HaloEditorHeader?.appendChild(container as HTMLElement);
    },
    Typecho: (result, container) => {
        const TinyMCE_Elements = (window as { tinymce?: TinyMCEType }).tinymce?.activeEditor
        if (TinyMCE_Elements) {
            const container = TinyMCE_Elements.getContainer();
            container?.appendChild(container as HTMLElement);

        }
    },
    phpBB: (result, container) => {
        const FullEditor = document.getElementById("message")?.parentElement //完整回复
        const messagebox = document.getElementById("message-box")
        try {
            if (FullEditor) {
                FullEditor.appendChild(container as HTMLElement);
            }
            if (messagebox) {
                messagebox.appendChild(container as HTMLElement);
            }
        } catch (error) {
            console.error("Failed to append container:", error);
        }
    },
    V2EX: (result, container) => {
        const topic_content = document.getElementById("topic_content")
        const reply_content = document.getElementById("reply_content")
        if (topic_content) {
            topic_content?.parentNode?.appendChild(container as HTMLElement);
        }
        if (reply_content) {
            reply_content?.parentNode?.appendChild(container as HTMLElement);
        }

        convertV2exUrlToImage()
    },
    nodeseek: (result, container) => {
        const editorElement = document.querySelector(".CodeMirror") as Element;
        if (editorElement && editorElement.parentNode) {
            editorElement.parentNode.appendChild(container as HTMLElement)

            setTimeout(function () {
                const element = container as HTMLElement;
                if (element && element.parentNode) {
                    const parent = element.parentNode;
                    for (let i = 0; i < 2; i++) {
                        const br = document.createElement("br");
                        parent.insertBefore(br, element);
                    }
                }

            }, 1000);
        }
    },
    lowendtalk: (result, container) => {
        let lowendtalkEditor = document.getElementById("Form_Body")
        if (lowendtalkEditor) {
            lowendtalkEditor?.parentNode?.appendChild(container as HTMLElement);
        }
    },
    CodeMirror5: (result, container) => {
        const editorElement = document.querySelector(".CodeMirror");
        if (editorElement) {
            editorElement?.parentNode?.appendChild(container as HTMLElement);

        }
    },
    CodeMirror6: (result, container) => {
        const editorElement = document.querySelector(".cm-editor");
        if (editorElement) {
            editorElement?.parentNode?.appendChild(container as HTMLElement);

        }
    },
    GutenbergEditor: (result, container) => {
        const wpfooter = document.getElementsByClassName("interface-interface-skeleton__footer")
        if (wpfooter.length) {
            wpfooter[wpfooter.length - 1].appendChild(container as HTMLElement);
        }
    },
    TinyMCE: (result, container) => {
        let Typecho = document.getElementById("btn-submit")
        if (Typecho) {
            Typecho?.parentNode?.appendChild(container as HTMLElement);
        }
    },
    wangEditor: (result, container) => {
        const wangeditor_Elements = (window as { editor?: wangEditorType }).editor?.getEditableContainer()
        if (wangeditor_Elements) {
            wangeditor_Elements.appendChild(container as HTMLElement);
        }
    },
    CKEditor4: (result, container) => {
        const ckeditor = (window as { CKEDITOR?: CKEditor4Type }).CKEDITOR;
        const ckeditor_Elements = ckeditor?.instances?.ckdemoarticle.container.$;
        if (ckeditor_Elements) {
            ckeditor_Elements.appendChild(container as HTMLElement);
        }
    },
    CKEditor5: (result, container) => {
        const editor = (window as { editor?: CKEditor5Type }).editor;
        const ckeditor5 = editor?.ui.view.editable.element;
        if (ckeditor5) {
            ckeditor5.parentNode?.appendChild(container as HTMLElement);
        }
    },
    UEditor: (result, container) => {
        const UE = (window as { UE?: UEType }).UE;
        const ueEditor = UE?.getEditor('editor_content');
        const ueditor_Elements_Node = ueEditor?.container
        if (ueditor_Elements_Node) {
            ueditor_Elements_Node.appendChild(container as HTMLElement)
        }
    },
    default: (result, container) => {
        // 当找不到匹配的编辑器时的默认处理函数
        console.log('Default handler', result);
    }
};


// 在编辑器中插入容器
export function placeContainerInEditor(container: HTMLElement): Promise<DetectionResult[]> {
    return new Promise((resolve) => {
        Detector.detectWhenReady({
            stabilityDelay: 1000,  // DOM稳定1秒后执行检测
            maxWaitTime: 8000,     // 最多等待5秒
            callback: (results) => {
                const result = results[0]; // 获取第一个检测结果 可信度最高的。
                const handler = editorInsertHandlers[result.type] || editorInsertHandlers.default;
                handler(result, container);
                resolve(results); // 返回编辑器类型
            }
        });
    })

}





// discuz url转图片
function convertDiscuzUrlToImage(): void {
    // url转图片
    const topicContentElements = Array.from(document.querySelectorAll('.t_f'));
    if (topicContentElements.length < 1) {
        return;
    }
    for (const replyContent of topicContentElements) {
        const clonedParagraph = replyContent.cloneNode(true) as Element;
        const imgElements = Array.from(clonedParagraph.querySelectorAll('img'));
        for (const imgElement of imgElements) {
            imgElement.remove();
        }

        const text = clonedParagraph.textContent as string;
        const imageLinks = text.match(/https?:\/\/[^\s]+/g) || [];
        // 去除屁股的html标签
        const cleanedImageLinks = imageLinks.map(link => link.replace(/<\/?[^>]+(>|$)/g, ''));
        cleanedImageLinks.forEach(link => {
            insertImageDiv(replyContent, link);
        });
    }
}

// v2ex url转图片
function convertV2exUrlToImage(): void {
    const topicContentElements = Array.from(document.querySelectorAll('.topic_content'));
    const replyContentElements = Array.from(document.querySelectorAll('.reply_content'));
    const elements = topicContentElements.concat(replyContentElements); // 合并两个数组
    if (elements.length < 1) {
        return
    }
    for (const replyContent of elements) {
        const anchorElements = Array.from(replyContent.querySelectorAll('a'));
        for (const anchorElement of anchorElements) {
            const imgElements = Array.from(anchorElement.querySelectorAll('img'));
            if (imgElements.length === 0) {
                const href = anchorElement.getAttribute('href') as string;
                insertImageDiv(anchorElement, href, "embedded_image");
            }
        }
    }
}


// 插入图片div
function insertImageDiv(element: Element, link: string, cssName?: string): void {
    const imgDiv = document.createElement('div');
    const imgElement = document.createElement('img');
    imgElement.src = link;
    if (cssName) {
        imgElement.className = cssName;
    }
    imgElement.loading = "lazy";

    imgDiv.appendChild(imgElement);
    element.appendChild(imgDiv);
    imgElement.onload = function () {
        imgDiv.className = `position-relative PL-ImgMark`;
        imgElement.alt = "转换";
        imgElement.title = link;

        if (!cssName) {
            // 如果图片宽度大于父元素宽度，将图片宽度设置为100%
            if (imgElement.width > element.clientWidth) {
                imgElement.style.width = "100%";
            }
        }

    };
    imgElement.onerror = function () {
        imgDiv.remove()
    };
}