'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Target, AlertTriangle, Apple, Dumbbell, Heart, Pill, Calendar, FileText, ChevronDown } from 'lucide-react';

interface RecommendationNavProps {
  sections: Array<{
    id: string;
    title: string;
    icon: string; // 改为明确是 string 类型
    priority?: 'high' | 'medium' | 'low';
  }>;
  clientName?: string;
}

export default function RecommendationNav({ sections, clientName }: RecommendationNavProps) {
  const params = useParams();
  const recommendationId = params.id as string;
  const [activeSection, setActiveSection] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!recommendationId) {
      alert('无法获取推荐ID');
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(
        `/api/recommendations/${recommendationId}/export/pdf?type=summary`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '导出失败');
      }

      // 下载文件 - 直接使用中文文件名
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `营养干预方案-${clientName || '客户'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('导出PDF失败:', error);
      alert(`导出失败: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    // 初始化时设置第一个 section 为 active
    if (sections.length > 0 && !activeSection) {
      setActiveSection(sections[0].id);
    }
  }, [sections]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header
      const sectionElements = document.querySelectorAll('[data-section-id]');

      let newActiveSection = activeSection;

      // 找到当前可见的 section
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        const sectionId = section.getAttribute('data-section-id');

        if (sectionId) {
          const sectionTop = section.getBoundingClientRect().top + window.scrollY;

          if (scrollPosition >= sectionTop - 100) {
            newActiveSection = sectionId;
            break;
          }
        }
      }

      // 如果找到了新的 section，更新状态
      if (newActiveSection !== activeSection) {
        setActiveSection(newActiveSection);
      }
    };

    // 使用 requestAnimationFrame 优化性能
    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', optimizedScroll);
  }, [activeSection]);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (element) {
      const offset = 100; // Fixed header offset
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const targetPosition = elementPosition - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });

      // 滚动完成后更新 active section
      setTimeout(() => {
        setActiveSection(sectionId);
      }, 500);

      setIsMobileMenuOpen(false);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Target,
      AlertTriangle,
      Apple,
      Dumbbell,
      Heart,
      Pill,
      Calendar,
      FileText,
    };
    return icons[iconName] || Target;
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-colors"
        aria-label="打开导航菜单"
      >
        <FileText className="w-6 h-6" />
      </button>

      {/* Sidebar */}
      <nav
        className={`
          fixed lg:sticky top-20 left-0 z-40 w-64 h-auto lg:h-[calc(100vh-6rem)]
          bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800
          overflow-hidden transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 h-full overflow-y-auto max-h-[calc(100vh-8rem)]">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 px-3">
            快速导航
          </h3>

          <ul className="space-y-1">
            {sections.map((section) => {
              const Icon = getIcon(section.icon);
              const isActive = activeSection === section.id;
              const isHighPriority = section.priority === 'high';

              return (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                      ${isActive
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }
                      ${isHighPriority && !isActive ? 'border-l-2 border-red-500' : ''}
                    `}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isHighPriority && !isActive ? 'text-red-500' : ''}`} />
                    <span className="flex-1 truncate">{section.title}</span>
                    {isActive && <ChevronDown className="w-4 h-4 rotate-[-90deg]" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700 space-y-2">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              {isExporting ? '导出中...' : '导出干预方案PDF'}
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
            >
              返回
            </button>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
