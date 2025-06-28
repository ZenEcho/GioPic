export type DetectedType =
  | 'Discuz'// CMS
  | 'Halo' // CMS
  | 'Typecho'// CMS
  | 'phpBB' // CMS
  | 'V2EX' // Domain
  | 'nodeseek'// Domain
  | 'lowendtalk' // Domain
  | 'CodeMirror5' // Editor
  | 'CodeMirror6' // Editor
  | 'GutenbergEditor' // Editor
  | 'TinyMCE' // Editor
  | 'wangEditor' // Editor
  | 'CKEditor4' // Editor
  | 'CKEditor5' // Editor
  | 'UEditor'  // Editor
  | 'unknown'; // 未知类型

export type DetectionResult = {
  type: DetectedType; // 类型
  certainty: number; // 置信度 0-1 越高越准确
  source: string; // 信任度的来源
};

export type HandlerFunction = (result: DetectionResult, container?: HTMLElement) => void;

// 在文件顶部添加类型声明
export type TinyMCEType = {
  activeEditor?: {
    getContainer: () => HTMLElement;
    execCommand: (command: string, ui: boolean, value: string) => void;
  };
};

export type wangEditorType = {
  getEditableContainer: () => HTMLElement | null;
  dangerouslyInsertHtml: (html: string) => void;
};

export type CKEditor4Type = {
  instances: {
    ckdemoarticle: {
      container: {
        $: HTMLElement;
      };
      insertHtml: (html: string) => void;
    };
  };
};
export type CKEditor5Type = {
  getData: () => string;
  setData: (data: string) => void;
  ui: {
    view: {
      editable: {
        element: HTMLElement;
      };
    };
  };
};

//UE 
export type UEType = {
  getEditor: (editorId: string) => {
    container: HTMLElement;
    execCommand: (command: string, options?: { src: string }) => void;
  };

};

// phpbb
export type phpBBType = {
  alert: (message: string) => void;
};



export interface CodeMirrorElementType extends Element {
  CodeMirror: {
    getValue: () => string;
    setValue: (value: string) => void;
  }
}
export type wpElementType = {
  data: {
    dispatch: (namespace: string) => {
      insertBlock: (block: any) => void;
    };
  };
  blocks: {
    createBlock: (blockName: string, attributes: any) => any;
  };
};