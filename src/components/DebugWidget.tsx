import React, { useState, useEffect } from 'react';
import { X, Terminal, Database, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function DebugWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Press Ctrl+Shift+D to toggle debug widget
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(!isOpen);
        if (!isOpen) {
          fetchStats();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen]);

  const fetchStats = async () => {
    setLoading(true);
    try {
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
        setStats(data);
      }
    } catch (error) {
      console.error('Debug widget error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => {
            setIsOpen(true);
            fetchStats();
          }}
          size="sm"
          variant="outline"
          className="bg-white dark:bg-slate-800 shadow-lg"
          title="Press Ctrl+Shift+D"
        >
          <Terminal className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-2xl border-2 border-slate-300 dark:border-slate-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-slate-900 dark:text-white">
                Debug Console
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchStats}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Press Ctrl+Shift+D to toggle
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto text-slate-400 animate-spin mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Loading stats...</p>
            </div>
          ) : stats ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  <Database className="w-4 h-4 text-slate-600 mb-1" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Total Items</p>
                  <p className="text-xl text-slate-900 dark:text-white">{stats.totalItems}</p>
                </div>
                <div className="bg-emerald-100 dark:bg-emerald-950 p-3 rounded-lg">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Valid</p>
                  <p className="text-xl text-emerald-900 dark:text-emerald-100">
                    {stats.validProperties}
                  </p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-600">
                  Pending: {stats.pendingCount}
                </Badge>
                <Badge className="bg-emerald-600">
                  Approved: {stats.approvedCount}
                </Badge>
                <Badge className="bg-red-600">
                  Rejected: {stats.rejectedCount}
                </Badge>
              </div>

              {/* Health Status */}
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">System Health</p>
                {stats.totalItems === 0 ? (
                  <p className="text-sm text-amber-600">⚠️ No data in database</p>
                ) : stats.validProperties === 0 ? (
                  <p className="text-sm text-red-600">❌ Data quality issue</p>
                ) : stats.approvedCount === 0 ? (
                  <p className="text-sm text-amber-600">⏱ Awaiting approvals</p>
                ) : (
                  <p className="text-sm text-emerald-600">✅ System operational</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => console.log('Full diagnostic data:', stats)}
                >
                  Log Full Data
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(stats, null, 2));
                    alert('Debug data copied to clipboard!');
                  }}
                >
                  Copy Data
                </Button>
              </div>

              {/* Console Tip */}
              <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded text-xs">
                <p className="text-blue-900 dark:text-blue-100">
                  💡 <strong>Tip:</strong> Check browser console for detailed logs
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 mx-auto text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Click refresh to load stats
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
