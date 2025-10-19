import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Diagnostics] Running database diagnostics...');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d4068603/debug/properties`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Diagnostics] Results:', data);
        setDiagnostics(data);
      } else {
        const errorText = await response.text();
        console.error('[Diagnostics] Error:', errorText);
        setError(`Failed to run diagnostics: ${response.status}`);
      }
    } catch (err) {
      console.error('[Diagnostics] Exception:', err);
      setError(`Exception: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Diagnostics
            </CardTitle>
            <CardDescription>
              Debug property retrieval issues
            </CardDescription>
          </div>
          <Button
            onClick={runDiagnostics}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-900 dark:text-red-100">Error</p>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {diagnostics && (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Items</p>
                <p className="text-2xl text-slate-900 dark:text-white">{diagnostics.totalItems}</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg">
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">Valid Properties</p>
                <p className="text-2xl text-emerald-900 dark:text-emerald-100">{diagnostics.validProperties}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <p className="text-sm text-amber-600 dark:text-amber-400 mb-1">Pending</p>
                <p className="text-2xl text-amber-900 dark:text-amber-100">{diagnostics.pendingCount}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Approved</p>
                <p className="text-2xl text-blue-900 dark:text-blue-100">{diagnostics.approvedCount}</p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-slate-900 dark:text-white mb-3">Database Items</h4>
              {diagnostics.items.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">No items found in database</p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                    Properties should appear here after upload
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {diagnostics.items.map((item: any) => (
                    <div
                      key={item.index}
                      className="flex items-start justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs text-slate-600 dark:text-slate-400">
                            {item.key}
                          </code>
                          {item.hasId && item.hasTitle ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                          {item.preview}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.valueType}
                          </Badge>
                          {item.status !== 'N/A' && (
                            <Badge
                              className={
                                item.status === 'approved'
                                  ? 'bg-emerald-600'
                                  : item.status === 'pending'
                                  ? 'bg-amber-600'
                                  : 'bg-red-600'
                              }
                            >
                              {item.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-500">
                        <span>ID: {item.hasId ? '✓' : '✗'}</span>
                        <span>Title: {item.hasTitle ? '✓' : '✗'}</span>
                        <span>Valid: {item.hasValue ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations */}
            {diagnostics.validProperties === 0 && diagnostics.totalItems > 0 && (
              <div className="flex items-start gap-2 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-amber-900 dark:text-amber-100">Data Quality Issue</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Found {diagnostics.totalItems} items in database, but none are valid properties.
                    This may indicate a data corruption issue. Contact support if this persists.
                  </p>
                </div>
              </div>
            )}

            {diagnostics.approvedCount === 0 && diagnostics.pendingCount > 0 && (
              <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-blue-900 dark:text-blue-100">Awaiting Admin Approval</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {diagnostics.pendingCount} {diagnostics.pendingCount === 1 ? 'property is' : 'properties are'} waiting
                    for admin approval. Properties only appear on the site after approval.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {!diagnostics && !error && (
          <div className="text-center py-8">
            <Database className="w-12 h-12 mx-auto text-slate-400 mb-2" />
            <p className="text-slate-600 dark:text-slate-400">
              Click "Run Diagnostics" to check database status
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
