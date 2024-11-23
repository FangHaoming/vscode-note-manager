import * as vscode from 'vscode';
import { ActivityBar } from './view';

export async function activate(context: vscode.ExtensionContext) {

	ActivityBar(context);

}