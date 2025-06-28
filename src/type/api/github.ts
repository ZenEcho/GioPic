export interface github_FileListResponseType {
    name: string;  // 文件名
    path: string;  // 文件路径
    sha: string;  // 文件的 SHA 哈希值
    size: number;  // 文件的大小（字节）
    url: string;  // 文件的 API 访问 URL
    html_url: string;  // 文件的 HTML 页面 URL
    git_url: string;  // 文件的 Git 访问 URL
    download_url: string;  // 文件的下载 URL
    type: string;  // 文件类型（通常是 "file"）
    _links: {
      self: string;  // API 访问该文件的 URL
      git: string;  // Git 访问该文件的 URL
      html: string;  // 文件的 HTML 页面 URL
    };
  }
  