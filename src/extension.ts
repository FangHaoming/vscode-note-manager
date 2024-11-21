import * as vscode from 'vscode';
import { FileTreeProvider } from './provider';
import * as fs from 'fs';
import * as path from 'path';

export async function activate(context: vscode.ExtensionContext) {

	// 初始化文件树提供器
	const fileTreeProvider = new FileTreeProvider();
	vscode.window.registerTreeDataProvider('fileTreeExplorer', fileTreeProvider);
	const loadSavedSelection = () => {
		const savePath = path.join(
			vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || __dirname,
			'selectedFiles.json'
		);

		if (fs.existsSync(savePath)) {
			const data = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
			fileTreeProvider.setTreeData(data);
			vscode.window.showInformationMessage('Loaded saved selection.');
		} else {
			vscode.window.showWarningMessage('No saved selection found.');
		}
		return savePath;
	};

	loadSavedSelection();

	// 注册选择文件/文件夹命令
	vscode.commands.registerCommand('fileTreeExplorer.selectFolderOrFile', async () => {
		const uris = await vscode.window.showOpenDialog({
			canSelectFiles: true,
			canSelectFolders: true,
			canSelectMany: true,
			openLabel: 'Select',
		});

		if (uris && uris.length > 0) {
			// 定义允许的文件类型
			const allowedExtensions = [
				// 文本文件类型
				'.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml',
				// 图片文件类型
				'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp', '.tiff',
				// 视频文件类型
				'.mp4', '.mkv', '.avi', '.mov', '.wmv', '.webm', '.flv',
			];

			// 递归构建文件夹及文件的层级结构
			const buildFileTree = (folderPath: string): any => {
				const tree: Record<string, any> = {};
				const items = fs.readdirSync(folderPath);

				items.forEach((item) => {
					const fullPath = path.join(folderPath, item);
					const stat = fs.statSync(fullPath);

					if (stat.isDirectory()) {
						// 对子文件夹递归处理

						tree[item] = buildFileTree(fullPath);
					} else if (stat.isFile()) {
						const ext = path.extname(fullPath).toLowerCase();
						if (allowedExtensions.includes(ext)) {
							// 保留符合条件的文件
							tree[item] = fullPath;
						}
					}
				});

				return tree;
			};

			// 构建选择结果的层级结构
			const resultTree: Record<string, any> = {};

			uris.forEach((uri) => {
				const filePath = uri.fsPath;
				const stat = fs.lstatSync(filePath);
				const fileName = path.basename(filePath);
				if (stat.isDirectory()) {
					// 对文件夹构建层级结构
					resultTree[fileName] = buildFileTree(filePath);
				} else if (stat.isFile()) {
					const ext = path.extname(filePath).toLowerCase();
					if (allowedExtensions.includes(ext)) {
						resultTree[fileName] = filePath;
					}
				}
			});

			// 保存数据到本地
			const savePath = path.join(
				vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || __dirname,
				'selectedFiles.json'
			);

			const newData = {
				...fileTreeProvider.getTreeData(),
				...resultTree,
			};



			fs.writeFileSync(savePath, JSON.stringify(newData, null, 2), 'utf-8');

			// 将层级结构保存到扩展全局状态
			await context.globalState.update('fileTreeSelectedPaths', newData);

			// 更新文件树
			fileTreeProvider.setTreeData(newData);

			vscode.window.showInformationMessage('Selection updated.');
		}
	});

	// 注册刷新命令
	vscode.commands.registerCommand('fileTreeExplorer.refresh', () => {
		fileTreeProvider.setTreeData({});
	});

	// 注册打开文件命令
	vscode.commands.registerCommand('fileTreeExplorer.openFile', (resource: vscode.Uri) => {
		vscode.window.showTextDocument(resource);
	});

	// 注册清除命令
	vscode.commands.registerCommand('fileTreeExplorer.clearSelection', async () => {
		// 清空全局状态存储的路径
		await context.globalState.update('fileTreeSelectedPaths', []);

		// 清空文件树
		fileTreeProvider.setTreeData({});

		vscode.window.showInformationMessage('Cleared all selected files and folders.');
	});
}