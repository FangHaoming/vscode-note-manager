import * as vscode from 'vscode';

export class FileTreeProvider implements vscode.TreeDataProvider<FileItem> {
  private treeData: Record<string, any> = {};
  context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async init(treeData?: Record<string, any>) {
    if (treeData) {
      this.setTreeData(treeData);
      return;
    }
    const data = await this.context.globalState.get('fileTreeSelectedPaths');
    data && this.setTreeData(data);
  }

  setTreeData(treeData: Record<string, any>) {
    this.treeData = treeData;
    this._onDidChangeTreeData.fire(null);
    this.context.globalState.update('fileTreeSelectedPaths', treeData);
  }

  getTreeData() {
    return this.treeData;
  }

  clear() {
    this.setTreeData({});
    this.context.globalState.update('fileTreeSelectedPaths', '');
  }

  private _onDidChangeTreeData: vscode.EventEmitter<FileItem | null> =
    new vscode.EventEmitter<FileItem | null>();
  readonly onDidChangeTreeData: vscode.Event<FileItem | null> =
    this._onDidChangeTreeData.event;

  getTreeItem(element: FileItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileItem): Thenable<FileItem[]> {
    if (!element) {
      // 根节点
      return Promise.resolve(
        Object.keys(this.treeData).map(
          (key) => new FileItem(key, this.treeData[key])
        )
      );
    }

    if (typeof element.data === 'object') {
      // 子节点
      return Promise.resolve(
        Object.keys(element.data).map(
          (key) => new FileItem(key, element.data[key])
        )
      );
    }

    return Promise.resolve([]); // 文件没有子节点
  }
}

export class FileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly data: any
  ) {
    super(
      label,
      typeof data === 'object'
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    if (typeof data === 'string') {
      this.resourceUri = vscode.Uri.file(data);
      this.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [this.resourceUri],
      };
    }
  }
}