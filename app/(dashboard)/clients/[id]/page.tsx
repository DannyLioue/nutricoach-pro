'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import CreateSummaryModal from '@/components/weekly-diet-summary/CreateSummaryModal';
import UpdateSummaryConfirmDialog from '@/components/weekly-diet-summary/UpdateSummaryConfirmDialog';
import { DietRecordUpload, DietTimelineView } from '@/components/diet-records';
import { ExerciseTimelineView } from '@/components/exercise-records';
import { Camera, FileText, Heart, BookOpen, Edit, UtensilsCrossed, Trash2, MessageSquare, Plus, Sparkles, ClipboardCheck, Calendar, X, Loader2, Dumbbell } from 'lucide-react';
import type { DietAnalysis, DietPhotoMealGroup, DietPhotoInGroup, WeeklyDietSummary } from '@/types';
import MealGroupUpload from '@/components/MealGroupUpload';
import MealGroupCard from '@/components/MealGroupCard';
import { CopyMealGroupModal } from '@/components/meal-groups/CopyMealGroupModal';
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

type TabType = 'profile' | 'consultations' | 'diet-records' | 'exercise-records' | 'health-reports' | 'interventions' | 'plan-evaluation';
type DietRecordsSubTab = 'photos' | 'meal-groups';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [highlightMealGroupId, setHighlightMealGroupId] = useState<string | null>(null);
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [showMealGroupUpload, setShowMealGroupUpload] = useState(false);
  const [showCreateSummary, setShowCreateSummary] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [photos, setPhotos] = useState<DietPhoto[]>([]);
  const [mealGroups, setMealGroups] = useState<DietPhotoMealGroup[]>([]);
  const [hasRecommendation, setHasRecommendation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzingPhotoId, setAnalyzingPhotoId] = useState<string | null>(null);
  const [analyzingMealGroupId, setAnalyzingMealGroupId] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [analyzingConsultationId, setAnalyzingConsultationId] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklyDietSummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<WeeklyDietSummary | null>(null);
  const [isDeletingSummary, setIsDeletingSummary] = useState(false);
  const [regenerateSummary, setRegenerateSummary] = useState<WeeklyDietSummary | null>(null);
  const [forceRegenerate, setForceRegenerate] = useState(false); // 是否强制重新生成所有食谱组
  const [copyMealGroup, setCopyMealGroup] = useState<DietPhotoMealGroup | null>(null);

  // Exercise records state
  const [exerciseRecords, setExerciseRecords] = useState<any[]>([]);

  // 更新汇总确认对话框状态
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [updatingSummaryId, setUpdatingSummaryId] = useState<string | null>(null);
  const [analyzingGroupId, setAnalyzingGroupId] = useState<string | null>(null);
  const [isIncrementalUpdating, setIsIncrementalUpdating] = useState(false);

  // Sync activeTab with URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null;
    if (tab && ['profile', 'consultations', 'diet-records', 'exercise-records', 'health-reports', 'interventions', 'plan-evaluation'].includes(tab)) {
      setActiveTab(tab);
    }
    const mealGroupId = searchParams.get('mealGroupId');
    if (mealGroupId) {
      setHighlightMealGroupId(mealGroupId);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchClient();
    fetchPhotos();
    fetchMealGroups();
    fetchConsultations();
    fetchEvaluations();
    fetchWeeklySummaries();
    fetchHasRecommendation();
    fetchExerciseRecords();
  }, [clientId]);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('tab', tab);
    newSearchParams.delete('mealGroupId');
    router.replace(`/clients/${clientId}?${newSearchParams.toString()}`, { scroll: false });
  };

  // Scroll to highlighted meal group
  useEffect(() => {
    if (highlightMealGroupId && activeTab === 'diet-records') {
      // Wait for the meal groups to render
      setTimeout(() => {
        const element = document.getElementById(`meal-group-${highlightMealGroupId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('ring-4', 'ring-orange-400', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-orange-400', 'ring-opacity-50');
          }, 3000);
        }
        setHighlightMealGroupId(null);
      }, 500);
    }
  }, [highlightMealGroupId, activeTab, mealGroups]);

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

  // 处理汇总生成过程中的食谱组实时更新
  const handleMealGroupUpdate = (mealGroupId: string, data: { totalScore: number; overallRating: string; combinedAnalysis: any }) => {
    setMealGroups(prevGroups =>
      prevGroups.map(group => {
        if (group.id === mealGroupId) {
          return {
            ...group,
            totalScore: data.totalScore,
            overallRating: data.overallRating as "优秀" | "良好" | "一般" | "需改善" | null,
            combinedAnalysis: data.combinedAnalysis as any,
          } as DietPhotoMealGroup;
        }
        return group;
      })
    );
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
    setAnalyzingMealGroupId(groupId);
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

      // 分析完成后，检查是否有关联的汇总需要更新
      await checkAndPromptSummaryUpdate(groupId);

      alert('食谱组分析完成！');
    } catch (err: any) {
      alert('分析失败：' + err.message);
      throw err;
    } finally {
      setAnalyzingMealGroupId(null);
    }
  };

  // 检查是否需要更新汇总，并提示用户
  const checkAndPromptSummaryUpdate = async (groupId: string) => {
    try {
      // 获取最近的汇总
      if (weeklySummaries.length === 0) {
        return;
      }

      // 获取食谱组信息
      const group = mealGroups.find(g => g.id === groupId);
      if (!group) {
        return;
      }

      // 检查最新的汇总是否需要更新
      const latestSummary = weeklySummaries[0];
      const res = await fetch(
        `/api/clients/${clientId}/weekly-diet-summary/check-updates?summaryId=${latestSummary.id}`
      );

      const data = await res.json();

      if (res.ok && data.hasUpdates) {
        // 检查当前分析的食谱组是否需要更新
        const needsUpdate = data.mealGroups?.some((mg: any) => mg.id === groupId && mg.needsUpdate);
        if (needsUpdate) {
          setAnalyzingGroupId(groupId);
          setUpdatingSummaryId(latestSummary.id);
          setShowUpdateConfirm(true);
        }
      }
    } catch (err) {
      console.error('检查更新失败:', err);
    }
  };

  // 处理增量更新汇总
  const handleIncrementalUpdate = async (): Promise<{ taskId: string; sseUrl: string }> => {
    if (!updatingSummaryId) {
      throw new Error('No summary ID');
    }

    setIsIncrementalUpdating(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/weekly-diet-summary/incremental-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summaryId: updatingSummaryId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '更新失败');
      }

      // 如果有任务ID，返回给对话框使用 SSE 连接
      if (data.taskId && data.sseUrl) {
        return { taskId: data.taskId, sseUrl: data.sseUrl };
      }

      // 如果已经是最新的
      if (data.alreadyUpToDate) {
        setShowUpdateConfirm(false);
        await fetchWeeklySummaries();
        throw new Error('Already up to date');
      }

      throw new Error('Invalid response');
    } catch (err: any) {
      if (err.message !== 'Already up to date') {
        alert('更新失败：' + err.message);
      }
      throw err;
    } finally {
      setIsIncrementalUpdating(false);
    }
  };

  // 增量更新成功后的回调
  const handleIncrementalUpdateSuccess = async () => {
    // 重新获取食谱组数据（显示新生成的分析结果）
    await fetchMealGroups();

    // 重新获取汇总列表
    await fetchWeeklySummaries();

    setUpdatingSummaryId(null);
    setAnalyzingGroupId(null);
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

  const handleCopyMealGroup = async (newDate: string) => {
    if (!copyMealGroup) return;

    try {
      const res = await fetch(
        `/api/clients/${clientId}/meal-groups/${copyMealGroup.id}/copy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newDate }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.details || '复制失败');
      }

      const result = await res.json();

      // 刷新食谱组列表
      await fetchMealGroups();

      // 可选：高亮显示新创建的食谱组
      if (result.mealGroup?.id) {
        setHighlightMealGroupId(result.mealGroup.id);
      }
    } catch (error: any) {
      console.error('[handleCopyMealGroup] Error:', error);
      alert('复制失败：' + error.message);
      throw error;
    }
  };

  const handleOpenCopyModal = (groupId: string) => {
    const group = mealGroups.find(g => g.id === groupId);
    if (group) {
      setCopyMealGroup(group);
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

  const fetchExerciseRecords = async () => {
    try {
      const res = await fetch(`/api/clients/${clientId}/exercise-records`);
      const data = await res.json();

      if (res.ok) {
        setExerciseRecords(data.exerciseRecords || []);
      }
    } catch (err) {
      console.error('Failed to fetch exercise records:', err);
    }
  };

  const handleCreateExerciseRecord = async (data: any) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/exercise-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || '创建失败');
      }

      await fetchExerciseRecords();
    } catch (err: any) {
      alert('创建运动记录失败：' + err.message);
      throw err;
    }
  };

  const handleDeleteExerciseRecord = async (recordId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/exercise-records/${recordId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // 从列表中移除
      setExerciseRecords(exerciseRecords.filter(r => r.id !== recordId));
    } catch (err: any) {
      alert('删除失败：' + err.message);
      throw err;
    }
  };

  const handleEditExerciseRecord = (record: any) => {
    // TODO: Implement edit functionality
    console.log('Edit exercise record:', record);
  };

  const handleDeleteSummary = async (summaryId: string) => {
    if (!confirm('确定要删除这条汇总记录吗？此操作不可恢复。')) {
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

  const handleRegenerateSummary = async (summaryId: string) => {
    const summary = weeklySummaries.find(s => s.id === summaryId);
    if (!summary) return;

    // 打开创建汇总弹窗，预填充日期范围
    setRegenerateSummary(summary);
    setForceRegenerate(false); // 普通重新生成，跳过已分析
    setShowCreateSummary(true);
  };

  const handleForceRegenerateSummary = async (summaryId: string) => {
    const summary = weeklySummaries.find(s => s.id === summaryId);
    if (!summary) return;

    // 打开创建汇总弹窗，预填充日期范围，强制重新生成所有
    setRegenerateSummary(summary);
    setForceRegenerate(true); // 强制重新生成所有
    setShowCreateSummary(true);
  };

  const handleCreateSummarySuccess = async () => {
    // 重新获取食谱组数据（显示新生成的分析结果）
    await fetchMealGroups();

    // 重新获取汇总列表
    await fetchWeeklySummaries();

    // 清除重新生成标记
    setRegenerateSummary(null);
    setForceRegenerate(false);

    // 滚动到汇总区域
    setTimeout(() => {
      const summarySection = document.getElementById('weekly-summary-section');
      if (summarySection) {
        summarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const tabs = [
    { id: 'profile' as TabType, label: '档案', icon: FileText },
    { id: 'consultations' as TabType, label: '咨询记录', icon: MessageSquare },
    { id: 'diet-records' as TabType, label: '饮食记录', icon: Camera },
    { id: 'exercise-records' as TabType, label: '运动记录', icon: Dumbbell },
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
      <div className="min-h-screen organic-bg">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="glass rounded-2xl p-8 text-center animate-scale-in">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--color-accent-500)' }} />
            <div style={{ color: 'var(--color-text-muted)' }}>加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen organic-bg">
        <DashboardNavbar />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="glass rounded-2xl p-8 text-center animate-scale-in">
            <p style={{ color: '#ef4444' }}>客户不存在</p>
            <Link href="/clients" className="mt-4 inline-block px-6 py-2 rounded-xl transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)', color: 'white' }}>
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
    <div className="min-h-screen organic-bg">
      <DashboardNavbar />

      <main className="max-w-6xl mx-auto px-6 py-8 animate-slide-up">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>
              {client.name}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              客户详情
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDeleteClient}
              className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
            >
              <Trash2 size={18} />
              删除客户
            </button>
            <Link
              href={`/clients/${client.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
            >
              <Edit size={18} />
              编辑信息
            </Link>
            <Link
              href="/clients"
              className="px-4 py-2 border font-medium rounded-xl transition-all hover:scale-105"
              style={{ borderColor: 'var(--color-primary-200)', color: 'var(--color-text-primary)', backgroundColor: 'white' }}
            >
              返回列表
            </Link>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="glass rounded-2xl shadow-md mb-6">
          <div style={{ borderBottom: '1px solid var(--color-bg-300)' }}>
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                      activeTab === tab.id
                        ? ''
                        : ''
                    }`}
                    style={activeTab === tab.id ? {
                      color: 'var(--color-primary-600)',
                      borderBottom: '2px solid var(--color-primary-600)',
                    } : {
                      color: 'var(--color-text-muted)',
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                      }
                    }}
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
        <div className="glass rounded-2xl shadow-md p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-primary-800)' }}>档案</h3>

              {/* 基本信息 */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ backgroundColor: 'var(--color-bg-100)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>性别</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {client.gender === 'MALE' ? '男' : client.gender === 'FEMALE' ? '女' : '其他'}
                  </p>
                </div>
                <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ backgroundColor: 'var(--color-bg-100)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>年龄</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{age} 岁</p>
                </div>
                <div className="p-4 rounded-xl transition-all hover:scale-105" style={{ backgroundColor: 'var(--color-bg-100)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>BMI</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {bmi} <span className="text-sm" style={{ color: bmiCategory.color.startsWith('text-') ? bmiCategory.color.replace('text-', '') === 'blue' ? '#3b82f6' : bmiCategory.color.replace('text-', '') === 'green' ? '#10b981' : bmiCategory.color.replace('text-', '') === 'yellow' ? '#f59e0b' : '#ef4444' : bmiCategory.color }}>({bmiCategory.label})</span>
                  </p>
                </div>
              </div>

              {/* 身体数据 */}
              <div>
                <h4 className="font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>身体数据</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 rounded-lg px-3 transition-all hover:scale-105" style={{ borderBottom: '1px solid var(--color-bg-300)', backgroundColor: 'var(--color-bg-50)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>身高</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{client.height} cm</span>
                  </div>
                  <div className="flex justify-between py-2 rounded-lg px-3 transition-all hover:scale-105" style={{ borderBottom: '1px solid var(--color-bg-300)', backgroundColor: 'var(--color-bg-50)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>体重</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{client.weight} kg</span>
                  </div>
                  <div className="flex justify-between py-2 rounded-lg px-3 transition-all hover:scale-105" style={{ borderBottom: '1px solid var(--color-bg-300)', backgroundColor: 'var(--color-bg-50)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>活动水平</span>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
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
                <h4 className="font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>健康信息</h4>
                <div className="space-y-3">
                  {allergies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>过敏原：</span>
                      {allergies.map((allergy, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' }}>
                          {allergy}
                        </span>
                      ))}
                    </div>
                  )}
                  {medicalHistory.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>疾病史：</span>
                      {medicalHistory.map((history, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#ea580c' }}>
                          {history}
                        </span>
                      ))}
                    </div>
                  )}
                  {healthConcerns.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>健康问题：</span>
                      {healthConcerns.map((concern, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' }}>
                          {concern}
                        </span>
                      ))}
                    </div>
                  )}
                  {client.preferences && (
                    <div>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>饮食偏好：</span>
                      <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>{client.preferences}</span>
                    </div>
                  )}
                  {client.userRequirements && (
                    <div>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>用户需求：</span>
                      <span className="ml-2" style={{ color: 'var(--color-text-primary)' }}>{client.userRequirements}</span>
                    </div>
                  )}
                  {client.exerciseDetails && (
                    <div>
                      <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>运动详情：</span>
                      <span className="ml-2 whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>{client.exerciseDetails}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 联系方式 */}
              <div>
                <h4 className="font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>联系方式</h4>
                <div className="space-y-2">
                  {client.phone && (
                    <div className="flex items-center gap-2 p-2 rounded-lg transition-all hover:scale-105" style={{ backgroundColor: 'var(--color-bg-100)', color: 'var(--color-text-primary)' }}>
                      <span>📱</span>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 p-2 rounded-lg transition-all hover:scale-105" style={{ backgroundColor: 'var(--color-bg-100)', color: 'var(--color-text-primary)' }}>
                      <span>📧</span>
                      <span>{client.email}</span>
                    </div>
                  )}
                  {!client.phone && !client.email && (
                    <p style={{ color: 'var(--color-text-muted)' }}>暂无联系方式</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'consultations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>咨询记录</h3>
                <button
                  onClick={() => router.push(`/clients/${clientId}/consultations/new`)}
                  className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)' }}
                >
                  <Plus size={18} />
                  新建咨询记录
                </button>
              </div>

              {consultations.length === 0 ? (
                <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: 'var(--color-bg-100)' }}>
                  <MessageSquare size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                  <p className="mb-2" style={{ color: 'var(--color-text-secondary)' }}>暂无咨询记录</p>
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>记录与客户的每次咨询，追踪进展和变化</p>
                  <button
                    onClick={() => router.push(`/clients/${clientId}/consultations/new`)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)' }}
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
                      className="p-4 rounded-xl transition-all hover:shadow-lg"
                      style={{ backgroundColor: 'var(--color-bg-50)', border: '1px solid var(--color-bg-300)' }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669' }}>
                              {consultation.consultationType}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              consultation.priority === 'high'
                                ? ''
                                : consultation.priority === 'medium'
                                ? ''
                                : ''
                            }`} style={{
                              backgroundColor: consultation.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : consultation.priority === 'medium' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                              color: consultation.priority === 'high' ? '#dc2626' : consultation.priority === 'medium' ? '#ca8a04' : '#6b7280'
                            }}>
                              {consultation.priority === 'high' ? '高优先级' : consultation.priority === 'medium' ? '中优先级' : '低优先级'}
                            </span>
                            {consultation.followUpRequired && (
                              <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                                需跟进 {consultation.followUpDate && new Date(consultation.followUpDate) < new Date() ? '(已逾期)' : ''}
                              </span>
                            )}
                            {consultation.analysis && (
                              <span className="px-2 py-1 rounded text-xs flex items-center gap-1" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                <Sparkles size={12} />
                                已分析
                              </span>
                            )}
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
                              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg disabled:opacity-50 transition-all hover:scale-105"
                              style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}
                              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'; }}
                            >
                              <Sparkles size={14} />
                              {analyzingConsultationId === consultation.id ? '分析中...' : 'AI分析'}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteConsultation(consultation.id)}
                            className="p-1.5 rounded-lg transition-all hover:scale-105"
                            style={{ color: '#dc2626' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {consultation.sessionNotes && (
                        <div className="mb-3">
                          <p className="text-sm line-clamp-3" style={{ color: 'var(--color-text-primary)' }}>
                            {consultation.sessionNotes}
                          </p>
                        </div>
                      )}

                      {consultation.analysis && (
                        <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-bg-100)' }}>
                          <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>AI分析摘要</p>
                          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{consultation.analysis.summary}</p>
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
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-primary-800)' }}>饮食记录</h3>

              {/* 饮食偏好概览 - 作为生成饮食建议的参考 */}
              <div className="rounded-2xl p-6 transition-all hover:scale-[1.01]" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}>
                    <FileText size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>饮食偏好概览</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
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
              {showQuickUpload && createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                  <div className="glass rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>快速记录</h3>
                        <button
                          onClick={() => setShowQuickUpload(false)}
                          className="p-2 rounded-lg transition-all hover:scale-105"
                          style={{ backgroundColor: 'var(--color-bg-200)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-300)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-200)'}
                        >
                          <X className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
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
                </div>,
                document.body
              )}

              {/* 合规评估上传弹窗 */}
              {showMealGroupUpload && createPortal(
                <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                  <div className="glass rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--color-primary-800)' }}>合规评估 - 创建食谱组</h3>
                        <button
                          onClick={() => setShowMealGroupUpload(false)}
                          className="p-2 rounded-lg transition-all hover:scale-105"
                          style={{ backgroundColor: 'var(--color-bg-200)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-300)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg-200)'}
                        >
                          <X className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
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
                </div>,
                document.body
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
                onCopyMealGroup={handleOpenCopyModal}
                analyzingGroupId={analyzingMealGroupId}
              />

              {/* 饮食汇总 */}
              <div id="weekly-summary-section" className="mt-8 pt-8" style={{ borderTop: '1px solid var(--color-bg-300)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold flex items-center gap-2" style={{ color: 'var(--color-primary-800)' }}>
                      <Calendar className="w-5 h-5" style={{ color: '#10b981' }} />
                      饮食汇总
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      基于食谱组的AI分析汇总，支持自定义日期范围（最多7天），包含合规性评价、营养分析和改进建议
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateSummary(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all hover:scale-105 shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-primary-700) 100%)', color: 'white' }}
                  >
                    <Plus className="w-4 h-4" />
                    创建汇总
                  </button>
                </div>

                {/* 重新生成提示 */}
                {weeklySummaries.length > 0 && (
                  <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div className="text-sm" style={{ color: '#b45309' }}>
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
                          onDelete={(summaryId) => handleDeleteSummary(summaryId)}
                          onRegenerate={handleRegenerateSummary}
                          onForceRegenerate={handleForceRegenerateSummary}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <WeeklyDietSummaryEmpty
                    onCreateSummary={() => setShowCreateSummary(true)}
                  />
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

          {/* 创建汇总弹窗 */}
          <CreateSummaryModal
            key={showCreateSummary ? 'modal-open' : 'modal-closed'}
            clientId={clientId}
            isOpen={showCreateSummary}
            onClose={() => {
              setShowCreateSummary(false);
              setRegenerateSummary(null);
              setForceRegenerate(false);
            }}
            onSuccess={handleCreateSummarySuccess}
            onMealGroupUpdate={handleMealGroupUpdate}
            prefilledData={regenerateSummary ? {
              startDate: regenerateSummary.weekStartDate,
              endDate: regenerateSummary.weekEndDate,
              summaryName: regenerateSummary.summaryName || undefined,
            } : undefined}
            forceRegenerate={forceRegenerate}
          />

          {/* 复制食谱组弹窗 */}
          <CopyMealGroupModal
            isOpen={!!copyMealGroup}
            onClose={() => setCopyMealGroup(null)}
            onConfirm={handleCopyMealGroup}
            mealGroupName={copyMealGroup?.name}
            mealType={copyMealGroup?.mealType || undefined}
          />

          {/* 更新汇总确认对话框 */}
          {showUpdateConfirm && updatingSummaryId && analyzingGroupId && (
            <UpdateSummaryConfirmDialog
              isOpen={showUpdateConfirm}
              onClose={() => {
                setShowUpdateConfirm(false);
                setUpdatingSummaryId(null);
                setAnalyzingGroupId(null);
              }}
              onConfirm={handleIncrementalUpdate}
              onSuccess={handleIncrementalUpdateSuccess}
              onMealGroupUpdate={handleMealGroupUpdate}
              clientId={clientId}
              summaryName={weeklySummaries.find(s => s.id === updatingSummaryId)?.summaryName || '未知汇总'}
              mealGroupName={mealGroups.find(g => g.id === analyzingGroupId)?.name || '未知食谱组'}
            />
          )}

          {activeTab === 'health-reports' && (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-primary-800)' }}>体检报告</h3>
              <ClientReportsList clientId={clientId} />
            </div>
          )}

          {activeTab === 'exercise-records' && (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-primary-800)' }}>运动记录</h3>
              <ExerciseTimelineView
                clientId={clientId}
                records={exerciseRecords}
                onCreate={handleCreateExerciseRecord}
                onDelete={handleDeleteExerciseRecord}
                onEdit={handleEditExerciseRecord}
              />
            </div>
          )}

          {activeTab === 'interventions' && (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-primary-800)' }}>干预方案</h3>
              <ClientRecommendationsList clientId={clientId} />
            </div>
          )}

          {activeTab === 'plan-evaluation' && (
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold mb-4" style={{ color: 'var(--color-primary-800)' }}>营养师计划评估</h3>

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
