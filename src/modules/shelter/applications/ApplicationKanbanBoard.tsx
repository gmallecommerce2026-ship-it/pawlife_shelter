// src/app/shelter/applications/ApplicationKanbanBoard.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  MeasuringStrategy,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KANBAN_COLUMNS, ApplicationStatus, AdoptionApplication } from '@/types/application';
import {
  useApplicationList,
  useApplicationActions,
  useApplicationFilter,
  selectFilteredApplications,
} from '@/stores/useApplicationStore';
import { ApplicationColumn } from './components/ApplicationColumn';
import { ApplicationCardContent } from './components/ApplicationCard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { ApplicationFilterBar } from './components/ApplicationFilterBar';
import { ApplicantProfileModal } from '@/components/ApplicantProfileModal';
import { AllDocumentsModal } from './components/AllDocumentsModal';
import { ApplicationQuickViewModal } from './components/ApplicationQuickViewModal';
import { InterviewScheduleModal } from './components/InterviewScheduleModal';
import { ApproveApplicationModal } from './components/ApproveApplicationModal';
import { NeedMoreInfoModal } from './components/NeedMoreInfoModal';
import { MoveToPendingModal } from './components/MoveToPendingModal';
import { RequestDocumentsModal } from './components/RequestDocumentsModal';
import { RequiredDocument } from '@/constants/adoptionDocuments';
import { applicationService } from '@/services/applicationService';

const isColumnId = (id: string | number) =>
  KANBAN_COLUMNS.some((c) => c.status === id);

const NEXT_STATUS_MAP: Partial<Record<ApplicationStatus, ApplicationStatus>> = {
  SUBMITTED: 'PENDING',
  PENDING: 'INTERVIEW_SCHEDULED',
  INTERVIEW_SCHEDULED: 'APPROVED',
  APPROVED: 'APPROVED',
};

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { filter } = useApplicationFilter();
  const { fetchApplications, moveApplication } = useApplicationActions();

  const [quickViewApp, setQuickViewApp] = useState<AdoptionApplication | null>(null);
  const [localItems, setLocalItems] = useState<AdoptionApplication[]>(items);
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);
  // States quản lý Modal chuyển trạng thái
  const [approveApp, setApproveApp] = useState<AdoptionApplication | null>(null);
  const [interviewApp, setInterviewApp] = useState<AdoptionApplication | null>(null);
  const [needInfoApp, setNeedInfoApp] = useState<AdoptionApplication | null>(null);
  const [pendingApp, setPendingApp] = useState<AdoptionApplication | null>(null);
  const [requestDocsApp, setRequestDocsApp] = useState<AdoptionApplication | null>(null);
  const [pendingRequiredDocs, setPendingRequiredDocs] = useState<RequiredDocument[]>([]);

  // State xác nhận đóng/từ chối đơn
  const [closeAppTarget, setCloseAppTarget] = useState<AdoptionApplication | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [isClosingApp, setIsClosingApp] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // Phẳng hóa mảng Tags
  const formattedItems = useMemo(() => {
    return localItems.map((app: any) => ({
      ...app,
      tags: app.tags ? app.tags.map((t: any) => t.tag || t) : [],
    }));
  }, [localItems]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalItems(items);
    }
  }, [items]);

  const [activeApp, setActiveApp] = useState<AdoptionApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(null);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);
  const [profileApp, setProfileApp] = useState<AdoptionApplication | null>(null);
  const [documentsApp, setDocumentsApp] = useState<AdoptionApplication | null>(null);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const REQUIRES_CONFIRM: ApplicationStatus[] = ['CLOSED'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const cardCollision = pointerCollisions.find((c) => !isColumnId(c.id));
      if (cardCollision) return [cardCollision];
      return pointerCollisions;
    }
    return rectIntersection(args);
  };

  const columns = useMemo(() => {
    const filtered = selectFilteredApplications(formattedItems, filter.search);
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      applications: filtered.filter((a) => a.status === col.status),
    }));
  }, [formattedItems, filter.search]);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setIsScrollable(scrollWidth > clientWidth);
      }
    };
    const timer = setTimeout(checkScrollable, 100);
    window.addEventListener('resize', checkScrollable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollable);
    };
  }, [columns]);
  useEffect(() => {
    if (approveApp) {
      const fresh = items.find((a) => a.id === approveApp.id);
      // Chỉ set lại khi thực sự có bản mới khác reference cũ, tránh loop vô ích
      if (fresh && fresh !== approveApp) {
        setApproveApp(fresh);
      }
    }
  }, [items, approveApp]);

  useEffect(() => {
    if (interviewApp) {
      const fresh = items.find((a) => a.id === interviewApp.id);
      if (fresh && fresh !== interviewApp) {
        setInterviewApp(fresh);
      }
    }
  }, [items, interviewApp]);
  const handleDragStart = (event: DragStartEvent) => {
    isDraggingRef.current = true;
    const app = localItems.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const activeItem = localItems.find((a) => a.id === activeId);
    if (!activeItem) return;

    const overIsColumn = isColumnId(overId);
    const overItem = localItems.find((a) => a.id === overId);
    const targetStatus = overIsColumn ? (overId as ApplicationStatus) : overItem?.status;
    if (!targetStatus) return;

    setOverColumn(targetStatus);
    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((a) => a.id === activeId);
      if (oldIndex === -1) return prev;

      if (activeItem.status === targetStatus && !overIsColumn && overItem) {
        const newIndex = prev.findIndex((a) => a.id === overId);
        if (newIndex === -1 || newIndex === oldIndex) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      }

      if (activeItem.status !== targetStatus) {
        const next = [...prev];
        next[oldIndex] = { ...next[oldIndex], status: targetStatus };
        if (!overIsColumn && overItem) {
          const newIndex = next.findIndex((a) => a.id === overId);
          return arrayMove(next, oldIndex, newIndex);
        }
        return next;
      }
      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    isDraggingRef.current = false;
    justDraggedRef.current = true;
    setTimeout(() => { justDraggedRef.current = false; }, 200);

    setActiveApp(null);

    const activeId = active.id as string;
    const originalItem = items.find((a) => a.id === activeId);

    let finalStatus: ApplicationStatus | undefined;

    if (over) {
      const overId = over.id as string;
      if (overId === activeId) {
        finalStatus = overColumn ?? undefined;
      } else {
        const overIsColumn = isColumnId(overId);
        const overItem = items.find((a) => a.id === overId);
        finalStatus = overIsColumn ? (overId as ApplicationStatus) : overItem?.status;
      }
    }
    console.log('[DragEnd]', { overId: over?.id, finalStatus, originalStatus: originalItem?.status });

    setOverColumn(null);

    if (!over || !originalItem || !finalStatus || finalStatus === originalItem.status) {
      console.log('[DragEnd] early return - bounce back');
      setLocalItems(items);
      return;
    }

    if (finalStatus === 'PENDING' && originalItem.status === 'SUBMITTED') {
      setPendingApp(originalItem);
      return;
    }

    if (finalStatus === 'NEED_MORE_INFO') {
      setRequestDocsApp(originalItem);
      return;
    }

    if (finalStatus === 'INTERVIEW_SCHEDULED') {
      setInterviewApp(originalItem);
      return;
    }

    if (REQUIRES_CONFIRM.includes(finalStatus)) {
      setCloseAppTarget(originalItem);
      return;
    }

    moveApplication(activeId, finalStatus);
  };

  const handleCardClick = (app: AdoptionApplication) => {
    console.log('[CardClick]', app.id, 'justDragged=', justDraggedRef.current)
    if (justDraggedRef.current) return;
    if (app.status === 'NEED_MORE_INFO') {
      setNeedInfoApp(app);
      return;
    }

    const nextStatus = NEXT_STATUS_MAP[app.status];
    switch (nextStatus) {
      case 'PENDING':
        setPendingApp(app);
        return;
      case 'INTERVIEW_SCHEDULED':
        setInterviewApp(app);
        return;
      case 'APPROVED':
        setApproveApp(app);
        return;
      default:
        setSelectedApp(app);
    }
  };

  // Đóng/Từ chối đơn thực tế
  const handleConfirmClose = async () => {
    if (!closeAppTarget) return;
    try {
      setIsClosingApp(true);
      await moveApplication(closeAppTarget.id, 'CLOSED', closeReason.trim() || 'Trạm đã đóng hồ sơ.');
      await fetchApplications();
      setCloseAppTarget(null);
      setCloseReason('');
    } catch (error) {
      console.error('Lỗi khi đóng hồ sơ:', error);
      alert('Không thể đóng đơn nhận nuôi. Vui lòng thử lại.');
    } finally {
      setIsClosingApp(false);
    }
  };

  return (
    <div className="flex flex-col justify-start gap-6 sm:gap-[40px] w-full overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4 w-full">
        <h1 className="font-['Be_Vietnam_Pro',_sans-serif] text-[24px] sm:text-[32px] lg:text-[40px] text-[#0D062D] font-semibold tracking-tight">
          Đăng ký nhận nuôi
        </h1>
        <ApplicationFilterBar />
      </div>

      {isLoading && localItems.length === 0 ? (
        <div className="flex gap-[11px] w-full h-[500px] sm:h-[741px] overflow-x-auto">
          {KANBAN_COLUMNS.map((col) => (
            <div
              key={col.status}
              className="flex-[1_0_260px] h-full rounded-[18px] bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={scrollContainerRef}
            className="flex gap-[11px] overflow-x-auto pb-4 items-start scroll-smooth w-full custom-board-scroll"
          >
            {columns.map((col) => (
              <ApplicationColumn
                key={col.status}
                status={col.status}
                label={col.label}
                applications={col.applications}
                movingIds={movingIds}
                isDropTarget={overColumn === col.status && activeApp?.status !== col.status}
                onOpenDetail={(app) => setSelectedApp(app)}
                onCardClick={handleCardClick}
                onOpenProfile={(app) => setProfileApp(app)}
                onRemove={(app) => setCloseAppTarget(app)}
                onOpenDocuments={(app) => setDocumentsApp(app)}
                onOpenQuickView={(app) => setQuickViewApp(app)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeApp ? (
              <div className="bg-white border-[0.8px] border-[#D9D9D9] rounded-[14px] shadow-2xl w-[260px] p-[14px] rotate-[2deg] scale-[1.03] cursor-grabbing pointer-events-none">
                <ApplicationCardContent
                  application={activeApp}
                  onOpenProfile={() => { }}
                  onOpenDetail={() => { }}
                  onRemove={() => { }}
                  onOpenDocuments={() => { }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {!isLoading && isScrollable && (
        <div className="flex justify-end w-full px-2 mt-[-8px] mb-2 animate-in fade-in duration-300">
          <p className="text-[12px] text-gray-500 flex items-center gap-1.5 italic">
            Mẹo: Nhấn giữ
            <kbd className="font-sans font-bold border border-gray-200 rounded px-1.5 py-0.5 bg-gray-50 text-[10px] not-italic shadow-sm text-gray-700">
              Shift
            </kbd>
            + Cuộn chuột ngang
          </p>
        </div>
      )}

      {/* Modal xác nhận Đóng / Hủy đơn (CLOSED) */}
      {closeAppTarget && (
        <div
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setCloseAppTarget(null)}
        >
          <div
            className="bg-white w-full max-w-[440px] rounded-[20px] shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] font-bold text-gray-900 mb-2">
              Đóng hồ sơ nhận nuôi?
            </h3>
            <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn đóng hoặc từ chối đơn nhận nuôi của{' '}
              <strong className="text-gray-900">
                {closeAppTarget.fullName || closeAppTarget.user?.name}
              </strong>{' '}
              cho bé <strong className="text-gray-900">{closeAppTarget.pet?.name}</strong>?
            </p>

            <div className="mb-5">
              <label className="text-[12px] font-medium text-gray-500 mb-1.5 block">
                Lý do từ chối / đóng hồ sơ:
              </label>
              <textarea
                rows={2}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="VD: Không đáp ứng đủ điều kiện không gian nuôi..."
                className="w-full border border-gray-200 rounded-[10px] p-2.5 text-[13px] outline-none focus:border-red-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setCloseAppTarget(null)}
                disabled={isClosingApp}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isClosingApp}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-lg transition-colors disabled:opacity-60"
              >
                {isClosingApp ? 'Đang đóng...' : 'Xác nhận đóng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => {
            setSelectedApp(null);
            fetchApplications();
          }}
        />
      )}

      {profileApp && (
        <ApplicantProfileModal
          application={profileApp}
          onClose={() => setProfileApp(null)}
        />
      )}

      {documentsApp && (
        <AllDocumentsModal
          application={documentsApp}
          onClose={() => setDocumentsApp(null)}
        />
      )}

      {pendingApp && (
        <MoveToPendingModal
          application={pendingApp}
          onClose={() => {
            setPendingApp(null);
            fetchApplications();
          }}
          onRefresh={fetchApplications}
          onSubmit={async (data) => {
            await moveApplication(pendingApp.id, 'PENDING', data?.reviewNote);
            await fetchApplications();
            setPendingApp(null);
          }}
        />
      )}

      {quickViewApp && (
        <ApplicationQuickViewModal
          application={quickViewApp}
          onClose={() => {
            setQuickViewApp(null);
            fetchApplications();
          }}
          onRefresh={fetchApplications}
        />
      )}

      {interviewApp && (
        <InterviewScheduleModal
          application={interviewApp}
          onClose={() => {
            setInterviewApp(null);
            fetchApplications();
          }}
          onRefresh={fetchApplications}
          onSubmit={async (data) => {
            const res = await applicationService.scheduleAppointment(interviewApp.id, data);
            await fetchApplications(); // Đồng bộ lại state toàn bộ Board
            setInterviewApp(null);
            return res;
          }}
        />
      )}

      {approveApp && (
        <ApproveApplicationModal
          application={approveApp}
          onClose={() => {
            setApproveApp(null);
            fetchApplications();
          }}
          onRefresh={fetchApplications}
          onScheduleInterview={async (applicationId, data) => {
            const appointment = await applicationService.scheduleAppointment(applicationId, data);
            await fetchApplications();
            return appointment;
          }}
          onSubmit={async (data) => {
            await moveApplication(approveApp.id, 'APPROVED', data?.reviewNote);
            await fetchApplications();
            setApproveApp(null);
          }}
        />
      )}

      {requestDocsApp && (
        <RequestDocumentsModal
          application={requestDocsApp}
          onClose={() => {
            setRequestDocsApp(null);
            fetchApplications();
          }}
          onNext={(documents) => {
            setPendingRequiredDocs(documents);
            setNeedInfoApp(requestDocsApp);
            setRequestDocsApp(null);
          }}
        />
      )}

      {needInfoApp && (
        <NeedMoreInfoModal
          application={needInfoApp}
          initialDocuments={pendingRequiredDocs}
          onClose={() => {
            setNeedInfoApp(null);
            setPendingRequiredDocs([]);
            fetchApplications();
          }}
          onRefresh={fetchApplications}
          onSubmit={async (data) => {
            await moveApplication(needInfoApp.id, 'NEED_MORE_INFO', data?.reviewNote);
            await fetchApplications();
            setNeedInfoApp(null);
            setPendingRequiredDocs([]);
          }}
        />
      )}

      <style jsx>{`
        .custom-board-scroll {
          scrollbar-width: thin;
          scrollbar-color: #E89B5A transparent;
        }
        .custom-board-scroll::-webkit-scrollbar {
          height: 8px;
        }
        .custom-board-scroll::-webkit-scrollbar-track {
          background: #F9FAFB;
          border-radius: 10px;
        }
        .custom-board-scroll::-webkit-scrollbar-thumb {
          background-color: #E89B5A;
          border-radius: 10px;
        }
        .custom-board-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #D68B4E;
        }
      `}</style>
    </div>
  );
};