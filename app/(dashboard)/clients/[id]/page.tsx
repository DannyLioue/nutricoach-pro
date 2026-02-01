'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import DashboardNavbar from '@/components/layout/DashboardNavbar';
import DietPhotoUpload from '@/components/DietPhotoUpload';
import DietPhotoCard from '@/components/DietPhotoCard';
import DietAnalysisSummary from '@/components/DietAnalysisSummary';
import ClientReportsList from '@/components/ClientReportsList';
import ClientRecommendationsList from '@/components/ClientRecommendationsList';
import {
  WeeklyDietSummaryCard,
  WeeklyDietSummaryEmpty,
  WeeklyDietSummaryModal,
} from '@/components/weekly-diet-summary';
import { DietRecordUpload, DietTimelineView } from '@/components/diet-records';
import { Camera, FileText, Heart, BookOpen, Edit, UtensilsCrossed, Trash2, MessageSquare, Plus, Sparkles, ClipboardCheck, Calendar, X, Loader2 } from 'lucide-react';
import type { DietAnalysis, DietPhotoMealGroup, DietPhotoInGroup, WeeklyDietSummary } from '@/types';
import MealGroupUpload from '@/components/MealGroupUpload';
import MealGroupCard from '@/components/MealGroupCard';
import { PlanEvaluationUpload, EvaluationResult } from '@/components/plan-evaluation';

interface Client {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  birthDate: string;
  height: number;
  weight: number;
  activityLevel: string;
  allergies: string;
  medicalHistory: string;
  healthConcerns?: string | null;
  preferences?: string | null;
  userRequirements?: string | null;
  exerciseDetails?: string | null;
  phone?: string | null;
  email?: string | null;
}

interface DietPhoto {
  id: string;
  imageUrl: string;
  mealType: string | null;
  notes: string | null;
  analysis: DietAnalysis | null;
  analyzedAt: string | null;
  uploadedAt: string;
}

interface Consultation {
  id: string;
  consultationDate: string;
  consultationType: string;
  sessionNotes: string | null;
  analysis: any;
  analyzedAt: string | null;
  priority: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  createdAt: string;
}

type TabType = 'profile' | 'consultations' | 'diet-records' | 'health-reports' | 'interventions' | 'plan-evaluation';
type DietRecordsSubTab = 'photos' | 'meal-groups';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [showMealGroupUpload, setShowMealGroupUpload] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [photos, setPhotos] = useState<DietPhoto[]>([]);
  const [mealGroups, setMealGroups] = useState<DietPhotoMealGroup[]>([]);
  const [hasRecommendation, setHasRecommendation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [analyzingConsultationId, setAnalyzingConsultationId] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklyDietSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<WeeklyDietSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isDeletingSummary, setIsDeletingSummary] = useState(false);

  useEffect(() => {
    fetchClient();
    fetchPhotos();
    fetchMealGroups();
    fetchConsultations();
    fetchEvaluations();
    fetchWeeklySummaries();
    fetchHasRecommendation();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '获取客户信息失败');
      }

      setClient(data.client);
    } catch (err: any) {
      console.error('Failed to fetch client:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHasRecommendation = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/recommendations`);
      const data = await res.json();

      if (res.ok) {
        setHasRecommendation((data.recommendations?.length || 0) > 0);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    }
  };

  const fetchPhotos = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/diet-photos`);
      const data = await res.json();

      if (res.ok) {
        setPhotos(data.photos || []);
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err);
    }
  };

  const handleAnalyzePhoto = async (photoId: string) => {
    setAnalyzingPhotoId(photoId);

    try {
      const res = await fetch(`/api/clients/${clientId}/diet-photos/${photoId}/analyze`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '分析失败');
      }

      // 重新获取照片列表
      await fetchPhotos();

      alert('分析完成！');
    } catch (err: any) {
      alert('分析失败：' + err.message);
    } finally {
      setAnalyzingPhotoId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('确定要删除这张照片吗？')) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}/diet-photos/${photoId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // 从列表中移除
      setPhotos(photos.filter(p => p.id !== photoId));
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  const handleUploadSuccess = () => {
    fetchPhotos();
  };

  const fetchMealGroups = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/meal-groups`);
      const data = await res.json();

      if (res.ok) {
        console.log('Fetched meal groups:', data.mealGroups?.length, 'groups');
        console.log('First meal group:', data.mealGroups?.[0]);
        console.log('Photos in first group:', data.mealGroups?.[0]?.photos);
        setMealGroups(data.mealGroups || []);
      }
    } catch (err) {
      console.error('Failed to fetch meal groups:', err);
    }
  };

  const handleMealGroupCreateSuccess = () => {
    fetchMealGroups();
    setShowMealGroupUpload(false);
  };

  const handleMealGroupEditSuccess = () => {
    fetchMealGroups();
  };

  const fetchConsultations = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/consultations`);
      const data = await res.json();

      if (res.ok) {
        setConsultations(data.consultations || []);
      }
    } catch (err) {
      console.error('Failed to fetch consultations:', err);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/plan-evaluations`);
      const data = await res.json();

      if (res.ok && data.evaluations?.length > 0) {
        setEvaluationHistory(data.evaluations);
        // 自动加载最新的评估结果
        const latest = data.evaluations[0];
        setEvaluationResult({
          planType: latest.planType,
          id: latest.id,
          overallStatus: latest.evaluation.overallStatus,
          safetyScore: latest.evaluation.safetyScore,
          summary: latest.evaluation.summary,
          keyFindings: latest.evaluation.keyFindings || [],
          concerns: latest.concerns || [],
          suggestions: latest.suggestions || [],
          optimizedPlan: latest.optimizedPlan || undefined,
        });
      }
    } catch (err) {
      console.error('Failed to fetch evaluations:', err);
    }
  };

  const handleAnalyzeMealGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/meal-groups/${groupId}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        // 如果是因为没有营养方案
        if (data.needsRecommendation) {
          const shouldGoToRecommendations = confirm(
            `${data.message}\n\n${data.suggestion}\n\n是否立即前往生成营养干预方案？`
          );
          if (shouldGoToRecommendations) {
            router.push(`/clients/${clientId}/recommendations/new`);
          }
          return;
        }
        throw new Error(data.error || '分析失败');
      }

      await fetchMealGroups();
      alert('食谱组分析完成！');
    } catch (err: any) {
      alert('分析失败：' + err.message);
      throw err;
    }
  };

  const handleAnalyzeMealGroupPhoto = async (groupId: string, photoId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/diet-photos/${photoId}/analyze`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        // 如果是因为没有营养方案
        if (data.needsRecommendation) {
          const shouldGoToRecommendations = confirm(
            `${data.message}\n\n${data.suggestion}\n\n是否立即前往生成营养干预方案？`
          );
          if (shouldGoToRecommendations) {
            router.push(`/clients/${clientId}/recommendations/new`);
          }
          return;
        }
        throw new Error(data.error || '分析失败');
      }

      // 重新获取食谱组数据（包含照片的分析状态）
      await fetchMealGroups();
      alert('照片分析完成！');
    } catch (err: any) {
      alert('分析失败：' + err.message);
      throw err;
    }
  };

  const handleDeleteMealGroup = async (groupId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/meal-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // 从列表中移除
      setMealGroups(mealGroups.filter(g => g.id !== groupId));
    } catch (err: any) {
      alert('删除失败：' + err.message);
      throw err;
    }
  };

  const handlePhotoClick = (photo: DietPhotoInGroup) => {
    // 可以打开照片详情弹窗，暂时不做
    console.log('Photo clicked:', photo);
  };

  const handleDeleteClient = async () => {
    if (!client) return;

    if (!confirm(`确定要删除客户 "${client.name}" 吗？此操作不可恢复，将删除所有相关数据。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      alert('客户已成功删除');
      router.push('/clients');
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  const handleAnalyzeConsultation = async (consultationId: string) => {
    setAnalyzingConsultationId(consultationId);

    try {
      const res = await fetch(`/api/clients/${clientId}/consultations/${consultationId}/analyze`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '分析失败');
      }

      // 重新获取咨询列表
      await fetchConsultations();

      alert('AI分析完成！');
    } catch (err: any) {
      alert('分析失败：' + err.message);
    } finally {
      setAnalyzingConsultationId(null);
    }
  };

  const handleDeleteConsultation = async (consultationId: string) => {
    if (!confirm('确定要删除这条咨询记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}/consultations/${consultationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // 从列表中移除
      setConsultations(consultations.filter(c => c.id !== consultationId));
    } catch (err: any) {
      alert('删除失败：' + err.message);
    }
  };

  const fetchWeeklySummaries = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/weekly-diet-summary?limit=10`);
      const data = await res.json();

      if (res.ok) {
        setWeeklySummaries(data.summaries || []);
      }
    } catch (err) {
      console.error('Failed to fetch weekly summaries:', err);
    }
  };

  const handleCreateWeeklySummary = async (forceRegenerate = false) => {
    setIsGeneratingSummary(true);

    try {
      // 创建一个带超时的 AbortController (10分钟超时)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

      const res = await fetch(`/api/clients/${clientId}/weekly-diet-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is valid
      if (!res) {
        throw new Error('无法连接到服务器，请检查网络连接');
      }

      // Try to parse JSON, handle cases where response is not JSON
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`服务器返回非JSON响应: ${text.slice(0, 200)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.details || '生成汇总失败');
      }

      // 重新获取汇总列表
      await fetchWeeklySummaries();

      // 滚动到汇总区域
      setTimeout(() => {
        const summarySection = document.getElementById('weekly-summary-section');
        if (summarySection) {
          summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

    } catch (err: any) {
      console.error('[handleCreateWeeklySummary] Error:', err);
      if (err.name === 'AbortError') {
        alert('生成汇总超时（超过10分钟），请稍后再试或联系技术支持');
      } else {
        alert('生成汇总失败：' + err.message);
      }
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDeleteSummary = async (summaryId: string) => {
    if (!confirm('确定要删除这条周汇总记录吗？此操作不可恢复。')) {
      return;
    }

    setIsDeletingSummary(true);

    try {
      const res = await fetch(`/api/clients/${clientId}/weekly-diet-summary/${summaryId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '删除失败');
      }

      // 从列表中移除
      setWeeklySummaries(weeklySummaries.filter(s => s.id !== summaryId));

      // 如果删除的是当前选中的汇总，关闭弹窗
      if (selectedSummary?.id === summaryId) {
        setSelectedSummary(null);
      }

      alert('汇总已删除');
    } catch (err: any) {
      alert('删除失败：' + err.message);
    } finally {
      setIsDeletingSummary(false);
    }
  };

  const tabs = [
    { id: 'profile' as TabType, label: '档案', icon: FileText },
    { id: 'consultations' as TabType, label: '咨询记录', icon: MessageSquare },
    { id: 'diet-records' as TabType, label: '饮食记录', icon: Camera },
    { id: 'health-reports' as TabType, label: '体检报告', icon: Heart },
    { id: 'interventions' as TabType, label: '干预方案', icon: BookOpen },
    { id: 'plan-evaluation' as TabType, label: '计划评估', icon: ClipboardCheck },
  ];

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateBMI = (height: number, weight: number) => {
    return (weight / ((height / 100) ** 2)).toFixed(1);
  };

  const parseJsonArray = (jsonString: string | null | undefined): string[] => {
    if (!jsonString || jsonString === '[]') return [];
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <div className="text-zinc-500">加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md p-8 text-center">
            <p className="text-red-500">客户不存在</p>
            <Link href="/clients" className="text-emerald-600 hover:underline mt-4 inline-block">
              返回列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const age = calculateAge(client.birthDate);
  const bmi = parseFloat(calculateBMI(client.height, client.weight));
  const allergies = parseJsonArray(client.allergies);
  const medicalHistory = parseJsonArray(client.medicalHistory);
  const healthConcerns = parseJsonArray(client.healthConcerns || null);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '偏瘦', color: 'text-blue-600' };
    if (bmi < 24) return { label: '正常', color: 'text-green-600' };
    if (bmi < 28) return { label: '超重', color: 'text-yellow-600' };
    return { label: '肥胖', color: 'text-red-600' };
  };

  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {client.name}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              客户详情
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteClient}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              删除客户
            </button>
            <Link
              href={`/clients/${client.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Edit size={18} />
              编辑信息
            </Link>
            <Link
              href="/clients"
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              返回列表
            </Link>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-emerald-600 border-b-2 border-emerald-600'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 标签页内容 */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-md border border-zinc-200 dark:border-zinc-800 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">档案</h3>

              {/* 基本信息 */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">性别</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {client.gender === 'MALE' ? '男' : client.gender === 'FEMALE' ? '女' : '其他'}
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">年龄</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{age} 岁</p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">BMI</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {bmi} <span className={`text-sm ${bmiCategory.color}`}>({bmiCategory.label})</span>
                  </p>
                </div>
              </div>

              {/* 身体数据 */}
              <div>
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3">身体数据</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-600 dark:text-zinc-400">身高</span>
                    <span className="font-medium">{client.height} cm</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-600 dark:text-zinc-400">体重</span>
                    <span className="font-medium">{client.weight} kg</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-600 dark:text-zinc-400">活动水平</span>
                    <span className="font-medium">
                      {client.activityLevel === 'SEDENTARY' ? '久坐' :
                       client.activityLevel === 'LIGHT' ? '轻度' :
                       client.activityLevel === 'MODERATE' ? '中度' :
                       client.activityLevel === 'ACTIVE' ? '活跃' : '非常活跃'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 健康信息 */}
              <div>
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3">健康信息</h4>
                <div className="space-y-3">
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">过敏原：</span>
                      {allergies.map((allergy, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                          {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                  {medicalHistory.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">疾病史：</span>
                      {medicalHistory.map((history, idx) => (
                        <span key={idx} className="px-2 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded text-sm">
                          {history}
                        </span>
                      ))}
                    </div>
                  )}
                  {healthConcerns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">健康问题：</span>
                      {healthConcerns.map((concern, idx) => (
                        <span key={idx} className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded text-sm">
                          {concern}
                        </span>
                      ))}
                    </div>
                  )}
                  {client.preferences && (
                    <div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">饮食偏好：</span>
                      <span className="ml-2 text-zinc-900 dark:text-zinc-100">{client.preferences}</span>
                    </div>
                  )}
                  {client.userRequirements && (
                    <div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">用户需求：</span>
                      <span className="ml-2 text-zinc-900 dark:text-zinc-100">{client.userRequirements}</span>
                    </div>
                  )}
                  {client.exerciseDetails && (
                    <div>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">运动详情：</span>
                      <span className="ml-2 text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">{client.exerciseDetails}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 联系方式 */}
              <div>
                <h4 className="font-medium text-zinc-700 dark:text-zinc-300 mb-3">联系方式</h4>
                <div className="space-y-2">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <span>📱</span>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                      <span>📧</span>
                      <span>{client.email}</span>
                    </div>
                  )}
                  {!client.phone && !client.email && (
                    <p className="text-zinc-400 dark:text-zinc-500">暂无联系方式</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">咨询记录</h3>
                <button
                  onClick={() => router.push(`/clients/${clientId}/consultations/new`)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={18} />
                  新建咨询记录
                </button>
              </div>

              {consultations.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <MessageSquare size={48} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400 mb-2">暂无咨询记录</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">记录与客户的每次咨询，追踪进展和变化</p>
                  <button
                    onClick={() => router.push(`/clients/${clientId}/consultations/new`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus size={18} />
                    创建第一条咨询记录
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-sm font-medium">
                              {consultation.consultationType}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              consultation.priority === 'high'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : consultation.priority === 'medium'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
                            }`}>
                              {consultation.priority === 'high' ? '高优先级' : consultation.priority === 'medium' ? '中优先级' : '低优先级'}
                            </span>
                            {consultation.followUpRequired && (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                需跟进 {consultation.followUpDate && new Date(consultation.followUpDate) < new Date() ? '(已逾期)' : ''}
                              </span>
                            )}
                            {consultation.analysis && (
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs flex items-center gap-1">
                                <Sparkles size={12} />
                                已分析
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {new Date(consultation.consultationDate).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!consultation.analysis && (
                            <button
                              onClick={() => handleAnalyzeConsultation(consultation.id)}
                              disabled={analyzingConsultationId === consultation.id}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 disabled:opacity-50 transition-colors"
                            >
                              <Sparkles size={14} />
                              {analyzingConsultationId === consultation.id ? '分析中...' : 'AI分析'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteConsultation(consultation.id)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {consultation.sessionNotes && (
                        <div className="mb-3">
                          <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
                            {consultation.sessionNotes}
                          </p>
                        </div>
                      )}

                      {consultation.analysis && (
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">AI分析摘要</p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{consultation.analysis.summary}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'diet-records' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">饮食记录</h3>

              {/* 饮食偏好概览 - 作为生成饮食建议的参考 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">饮食偏好概览</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      基于已分析的饮食照片汇总，用于生成个性化干预方案
                    </p>
                  </div>
                </div>
                <DietAnalysisSummary clientId={clientId} />
              </div>

              {/* 统一上传界面 */}
              <DietRecordUpload
                clientId={clientId}
                hasRecommendation={hasRecommendation}
                onQuickUploadClick={() => setShowQuickUpload(true)}
                onMealGroupClick={() => setShowMealGroupUpload(true)}
                isAnalyzing={analyzingPhotoId !== null}
              />

              {/* 快速上传弹窗 */}
              {showQuickUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">快速记录</h3>
                        <button
                          onClick={() => setShowQuickUpload(false)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <DietPhotoUpload
                        clientId={clientId}
                        onUploadSuccess={() => {
                          handleUploadSuccess();
                          setShowQuickUpload(false);
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 合规评估上传弹窗 */}
              {showMealGroupUpload && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">合规评估 - 创建食谱组</h3>
                        <button
                          onClick={() => setShowMealGroupUpload(false)}
                          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <MealGroupUpload
                        clientId={clientId}
                        onCreateSuccess={() => {
                          handleMealGroupCreateSuccess();
                          setShowMealGroupUpload(false);
                        }}
                        onCancel={() => setShowMealGroupUpload(false)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 时间线视图 */}
              <DietTimelineView
                clientId={clientId}
                photos={photos}
                mealGroups={mealGroups}
                onAnalyzePhoto={handleAnalyzePhoto}
                onAnalyzeMealGroup={handleAnalyzeMealGroup}
                onAnalyzeMealGroupPhoto={handleAnalyzeMealGroupPhoto}
                onDeletePhoto={handleDeletePhoto}
                onDeleteMealGroup={handleDeleteMealGroup}
                onEditMealGroup={handleMealGroupEditSuccess}
              />

              {/* 本周饮食汇总 */}
              <div id="weekly-summary-section" className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      本周饮食汇总
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      基于本周食谱组的AI分析汇总，包含合规性评价、营养分析和改进建议
                    </p>
                  </div>
                </div>

                {/* 重新生成提示 */}
                {weeklySummaries.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-medium mb-1">关于评分理由的提示</p>
                        <p className="opacity-90">
                          如果您的汇总中没有显示每餐的详细评分理由（蛋白质/蔬菜/红灯食物分析），请删除旧汇总后重新生成以获取完整分析。
                          新版本包含：每餐评分理由、营养分析详细分解、所有食物列表。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {weeklySummaries.length > 0 ? (
                  <div className="space-y-4">
                    {weeklySummaries.map((summary, index) => {
                      // 获取上周的数据用于对比
                      const previousSummary = index > 0 ? weeklySummaries[index - 1] : null;

                      return (
                        <WeeklyDietSummaryCard
                          key={summary.id}
                          summary={summary}
                          previousSummary={previousSummary}
                          onViewDetails={(summaryId) => {
                            const s = weeklySummaries.find(s => s.id === summaryId);
                            if (s) setSelectedSummary(s);
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <WeeklyDietSummaryEmpty
                    onCreateSummary={() => handleCreateWeeklySummary(false)}
                    isGenerating={isGeneratingSummary}
                  />
                )}

                {/* 强制重新生成按钮 */}
                {weeklySummaries.length > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        if (confirm('确定要重新生成本周汇总吗？这将覆盖现有汇总。')) {
                          handleCreateWeeklySummary(true);
                        }
                      }}
                      disabled={isGeneratingSummary}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>正在生成中...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>强制重新生成本周汇总</span>
                        </>
                      )}
                    </button>

                    {/* 生成进度提示 */}
                    {isGeneratingSummary && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg max-w-md mx-auto">
                        <div className="flex items-start gap-3">
                          <Loader2 size={18} className="animate-spin text-blue-600 mt-0.5" />
                          <div className="text-sm text-left">
                            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">正在生成本周饮食汇总</p>
                            <p className="text-blue-700 dark:text-blue-300 text-xs">
                              AI正在分析本周的所有饮食记录，这可能需要30秒到2分钟，请稍候...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 汇总详情弹窗 */}
          {selectedSummary && (
            <WeeklyDietSummaryModal
              content={selectedSummary.summary as any}
              weekRange={`${selectedSummary.weekStartDate} 至 ${selectedSummary.weekEndDate}`}
              generatedAt={new Date(selectedSummary.generatedAt)}
              summaryId={selectedSummary.id}
              clientId={clientId}
              onClose={() => setSelectedSummary(null)}
              onDelete={handleDeleteSummary}
              isDeleting={isDeletingSummary}
            />
          )}

          {activeTab === 'health-reports' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">体检报告</h3>
              <ClientReportsList clientId={clientId} />
            </div>
          )}

          {activeTab === 'interventions' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">干预方案</h3>
              <ClientRecommendationsList clientId={clientId} />
            </div>
          )}

          {activeTab === 'plan-evaluation' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">营养师计划评估</h3>

              {!evaluationResult ? (
                <PlanEvaluationUpload
                  clientId={clientId}
                  onEvaluationComplete={(result) => setEvaluationResult(result)}
                />
              ) : (
                <EvaluationResult
                  evaluation={evaluationResult}
                  onReEvaluate={() => setEvaluationResult(null)}
                  clientId={clientId}
                />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
