import * as vscode from 'vscode';

class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined> = new vscode.EventEmitter<FileTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined> = this._onDidChangeTreeData.event;

	getTreeItem(element: FileTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(): FileTreeItem[] {
		return [
			new FileTreeItem("File1.txt", vscode.TreeItemCollapsibleState.None),
			new FileTreeItem("Folder1", vscode.TreeItemCollapsibleState.Collapsed, [
				new FileTreeItem("File2.txt", vscode.TreeItemCollapsibleState.None)
			])
		];
	}
}

class FileTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly children: FileTreeItem[] = []
	) {
		super(label, collapsibleState);
	}
}
// enabled
export function activate(context: vscode.ExtensionContext) {
	const noteManagerProvider = new NoteManagerProvider(context.extensionUri);

	vscode.window.registerWebviewViewProvider("fileTreeExplorer", noteManagerProvider);

	const fileTreeProvider = new FileTreeProvider();
	vscode.window.registerTreeDataProvider("fileTreeExplorer", fileTreeProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand("fileTreeExplorer.addFile", () => {
			vscode.window.showInformationMessage("Add File Command Invoked");
		}),
		vscode.commands.registerCommand("fileTreeExplorer.deleteFile", () => {
			vscode.window.showInformationMessage("Delete File Command Invoked");
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("fileTreeExplorer.openNote", () => {
			vscode.window.showInformationMessage("Note Manager is active!");
		})
	);
}

class NoteManagerProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(private readonly extensionUri: vscode.Uri) { }

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		this._view = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.extensionUri]
		};

		webviewView.webview.html = this.getHtmlForWebview();
	}


	private getHtmlForWebview(): string {
		return `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
  <script>
    tinymce.init({
      selector: '#editor'
    });
  </script>
</head>
<body>
  <textarea id="editor"></textarea>
</body>
</html>
    `;
	}
}