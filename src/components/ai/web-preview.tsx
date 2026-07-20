'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, RotateCw, ExternalLink, Globe, ShieldAlert } from 'lucide-react';
import type { ComponentProps } from 'react';
import { createContext, useContext, useEffect, useState, useRef } from 'react';

export type WebPreviewContextValue = {
  url: string;
  setUrl: (url: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  reload: () => void;
};

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

const useWebPreview = () => {
  const context = useContext(WebPreviewContext);
  if (!context) {
    throw new Error('WebPreview components must be used within a WebPreview');
  }
  return context;
};

export type WebPreviewProps = ComponentProps<'div'> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};

export const WebPreview = ({
  className,
  children,
  defaultUrl = '',
  onUrlChange,
  ...props
}: WebPreviewProps) => {
  const [url, setUrl] = useState(defaultUrl);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (typeof defaultUrl === 'string' && defaultUrl && defaultUrl !== url) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUrlChange?.(newUrl);
  };

  const reload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = url;
    }
  };

  const contextValue: WebPreviewContextValue = {
    url,
    setUrl: handleUrlChange,
    iframeRef,
    reload,
  };

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        className={cn(
          'w-full flex flex-col rounded-2xl border bg-card overflow-hidden shadow-2xl border-gray-250/50 dark:border-white/5 backdrop-blur-md bg-white/50 dark:bg-slate-950/50 transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
};

export type WebPreviewNavigationProps = ComponentProps<'div'>;

export const WebPreviewNavigation = ({
  className,
  children,
  ...props
}: WebPreviewNavigationProps) => {
  const { url, reload } = useWebPreview();
  
  const handleOpenExternal = () => {
    if (url) {
      window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={cn('flex items-center gap-2 border-b border-gray-250/20 dark:border-white/5 p-3 bg-gray-50/50 dark:bg-slate-900/50', className)}
      {...props}
    >
      {/* macOS style dots */}
      <div className="flex gap-1.5 mr-2">
        <div className="w-3 h-3 rounded-full bg-red-400 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
        <div className="w-3 h-3 rounded-full bg-green-400 opacity-80" />
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white" disabled>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white" disabled>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button type="button" onClick={reload} variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {children}

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              onClick={handleOpenExternal}
              className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:text-gray-955 dark:hover:text-white"
              size="sm"
              variant="ghost"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Abrir en pestaña nueva</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export type WebPreviewUrlProps = ComponentProps<typeof Input>;

export const WebPreviewUrl = ({
  value,
  onChange,
  onKeyDown,
  className,
  ...props
}: WebPreviewUrlProps) => {
  const { url, setUrl } = useWebPreview();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const target = event.target as HTMLInputElement;
      let targetUrl = target.value.trim();
      if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }
      setUrl(targetUrl);
    }
    onKeyDown?.(event);
  };

  return (
    <div className="relative flex-1 flex items-center max-w-lg mx-auto">
      <Globe className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      <Input
        className={cn(
          "h-8 pl-9 pr-4 text-xs bg-white/70 dark:bg-slate-950/70 border-gray-200/50 dark:border-white/5 rounded-lg focus-visible:ring-1 focus-visible:ring-blue-500",
          className
        )}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Buscar o escribir dirección web..."
        value={value ?? url}
        {...props}
      />
    </div>
  );
};

export type WebPreviewBodyProps = ComponentProps<'iframe'>;

export const WebPreviewBody = ({
  className,
  src,
  ...props
}: WebPreviewBodyProps) => {
  const { url, iframeRef } = useWebPreview();

  return (
    <div className="relative flex-1 bg-white/50 dark:bg-slate-950/50 w-full min-h-[450px]">
      <iframe
        ref={iframeRef}
        className={cn('w-full h-[450px] border-0', className)}
        sandbox="allow-scripts allow-forms allow-popups allow-presentation"
        src={src ?? url}
        title="Web Preview"
        {...props}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold shadow-sm backdrop-blur-md pointer-events-none">
        <ShieldAlert className="w-3.5 h-3.5" />
        <span>Si el sitio no carga, haz clic en el icono externo para abrir en pestaña nueva</span>
      </div>
    </div>
  );
};
