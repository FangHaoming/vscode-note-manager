import * as vscode from 'vscode';
import path from 'path';

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

  async getChildren(element?: FileItem): Promise<FileItem[]> {
    if (!element) {
      // 根节点：从 treeData 中获取顶层文件夹
      return Object.keys(this.treeData).map(
        (key) => new FileItem(key, this.treeData[key])
      );
    }

    // 子节点：检查 element.data 是否为对象
    if (typeof element.data === 'object') {
      return Object.keys(element.data).map(
        (key) => new FileItem(key, element.data[key])
      );
    }

    // 文件：无子节点
    return [];
  }
}

export class FileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly data: any,
    public filePath?: string,
    public isFolder?: boolean
  ) {
    super(
      label,
      typeof data === 'object'
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    this.isFolder = typeof data === 'object';
    this.filePath = data as string;
    if (this.isFolder) {
      const childrenNameList = Reflect.ownKeys(data);
      if (childrenNameList.length > 0) {
        const firstChildPath = data[childrenNameList[0]];
        if (typeof firstChildPath === 'string') {
          this.filePath = firstChildPath.replace(`/${path.basename(firstChildPath)}`, '');
        }
      }
    }
    if (!this.isFolder) {
      this.command = {
        command: 'fileTreeExplorer.itemClicked',
        title: 'Item Clicked',
        arguments: [this],
      };
    }


    this.iconPath = this.isFolder ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
  }
}