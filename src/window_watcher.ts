import * as vscode from 'vscode';
import {Disposable, window} from 'vscode';
import GDScriptDiagnosticSeverity from './gdscript/diagnostic';
import GDScriptCompleter from './gdscript/completion';
import config from './config';

interface DocumentFlag {
  path: string,
  version: number
}

class WindowWatcher {
  
  private _disposable: Disposable;
  private _diagnosticSeverity: GDScriptDiagnosticSeverity;
  private _lastText: DocumentFlag;

  constructor() {
    let subscriptions: Disposable[] = [];
    window.onDidChangeTextEditorSelection(this.onDidChangeTextEditorSelection.bind(this), this, subscriptions);
    window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor.bind(this), this, subscriptions);
    window.onDidChangeTextEditorOptions(this.onDidChangeTextEditorOptions.bind(this), this, subscriptions);
    window.onDidChangeTextEditorViewColumn(this.onDidChangeTextEditorViewColumn.bind(this), this, subscriptions);
    
    this._diagnosticSeverity = new GDScriptDiagnosticSeverity();
    this._disposable = Disposable.from(...subscriptions, this._diagnosticSeverity);
    this._lastText = {path: "-1", version: -1};
  }

  dispose() {
      this._disposable.dispose();
  }

  /**
   * Fires when the [active editor](#window.activeTextEditor)
   * has changed. *Note* that the event also fires when the active editor changes
   * to `undefined`.
   */
  private onDidChangeActiveTextEditor(event: any) {
    // console.log("[GodotTools]:onDidChangeActiveTextEditor", event);
    if(window.activeTextEditor != undefined) { 
      const doc = window.activeTextEditor.document;
      const script = config.loadSymbolsFromFile(doc.fileName);
      if (vscode.workspace.getConfiguration("GodotTools").get("enableSyntaxChecking", true)) {
        this._diagnosticSeverity.validateScript(doc, script).then(()=>{});
      }
      this._lastText = {path: doc.fileName, version: doc.version};
    }
  }

  /**
   * Fires when the selection in an editor has changed.
   */
  private onDidChangeTextEditorSelection(event: any) {
    // console.log("[GodotTools]:onDidChangeTextEditorSelection");
    const doc = window.activeTextEditor.document;
    const curText: DocumentFlag= {path: doc.fileName, version: doc.version};
    // Check content changed
    if(this._lastText.path != curText.path || this._lastText.version != curText.version) {
      const script = config.loadSymbolsFromFile(doc.fileName);
      if (vscode.workspace.getConfiguration("GodotTools").get("enableSyntaxChecking", true)) {
        this._diagnosticSeverity.validateScript(doc, script).then(()=>{});
      }
      this._lastText = curText;
    }
  }

  /**
   * Fires when the options of an editor have changed.
   */
  private onDidChangeTextEditorOptions(event: any) {
    // console.log("[GodotTools]:onDidChangeTextEditorOptions", event);
  }

  /**
   * Fires when the view column of an editor has changed.
   */
  private onDidChangeTextEditorViewColumn(event: any) {
    // console.log("[GodotTools]:onDidChangeTextEditorViewColumn", event);
  }
}

export default WindowWatcher;