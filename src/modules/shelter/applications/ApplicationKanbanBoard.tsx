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
import { useTagColorStore } from '@/stores/useTagColorStore';

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
  const { getTagColor, setTagColor } = useTagColorStore();

  const [quickViewApp, setQuickViewApp] = useState<AdoptionApplication | null>(null);
  const [localItems, setLocalItems] = useState<AdoptionApplication[]>(items);
  const isDraggingRef = useRef(false);
  const justDraggedRef = useRef(false);

  // States modal
  const [approveApp, setApproveApp] = useState<AdoptionApplication | null>(null);
  const [interviewApp, setInterviewApp] = useState<AdoptionApplication | null>(null);
  const [needInfoApp, setNeedInfoApp] = useState<AdoptionApplication | null>(null);
  const [pendingApp, setPendingApp] = useState<AdoptionApplication | null>(null);
  const [requestDocsApp, setRequestDocsApp] = useState<AdoptionApplication | null>(null);
  const [pendingRequiredDocs, setPendingRequiredDocs] = useState<RequiredDocument[]>([]);
  const [closeAppTarget, setCloseAppTarget] = useState<AdoptionApplication | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [isClosingApp, setIsClosingApp] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const formattedItems = useMemo(() => {
    return localItems.map((app: any) => ({
      ...app,
      tags: app.tags
        ? app.tags.map((t: any) => {
            const base = t && typeof t === 'object' && t.tag
              ? { ...t.tag, id: t.tag.id || t.id, color: t.tag.color || t.color }
              : t;
            const syncedColor = getTagColor(base?.name) || base?.color;
            return { ...base, color: syncedColor };
          })
        : [],
    }));
  }, [localItems, getTagColor]);

  useEffect(() => {
    items.forEach((app: any) => {
      (app.tags || []).forEach((t: any) => {
        const tagObj = t?.tag || t;
        if (tagObj?.name && tagObj?.color) {
          setTagColor(tagObj.name, tagObj.color);
        }
      });
    });
  }, [items, setTagColor]);

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
  }, [fetchApplications]);

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
    const filtered = selectFilteredApplications(formattedItems, filter.search, filter.noteTypes);
    return KANBAN_COLUMNS.map((col) => ({
      ...col,
      applications: filtered.filter((a) => a.status === col.status),
    }));
  }, [formattedItems, filter.search, filter.noteTypes]);

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

    setOverColumn(null);

    if (!over || !originalItem || !finalStatus || finalStatus === originalItem.status) {
      setLocalItems(items);
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

  const handleCompleteAdoption = async (applicationId: string) => {
    try {
      await applicationService.updateStatus(applicationId, 'ADOPTION_COMPLETED');
      await fetchApplications();
      setApproveApp(null);
    } catch (error) {
      console.error('Lỗi khi hoàn tất nhận nuôi:', error);
      alert('Không thể hoàn tất nhận nuôi. Vui lòng thử lại.');
    }
  };

  return (
    // Toàn bộ màn hình chiếm đúng 100dvh trừ phần top bar của Shelter Layout
    <div className="flex flex-col w-full h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4.5rem)] overflow-hidden gap-2 pb-1">
      
      {/* 1. Header & Filter Bar thu gọn tối đa khoảng trống dọc */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0 w-full px-1">
        <h1 className="font-['Be_Vietnam_Pro',_sans-serif] text-[18px] sm:text-[22px] lg:text-[24px] text-[#0D062D] font-bold tracking-tight">
          Đăng ký nhận nuôi
        </h1>
        <ApplicationFilterBar />
      </div>

      {/* 2. Vùng chứa Kanban Board: Chiếm 100% không gian dọc còn lại */}
      <div className="flex-1 min-h-0 w-full relative">
        {isLoading && localItems.length === 0 ? (
          <div className="flex gap-2.5 sm:gap-3 w-full h-full overflow-x-auto pb-1">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.status}
                className="w-[270px] sm:w-[290px] lg:w-[310px] flex-shrink-0 h-full rounded-[14px] bg-gray-100/70 animate-pulse border border-gray-200"
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
              className="flex gap-2.5 sm:gap-3.5 overflow-x-auto items-stretch h-full w-full pb-1 scroll-smooth custom-board-scroll"
            >
              {columns.map((col) => (
                <div
                  key={col.status}
                  className="w-[270px] sm:w-[290px] lg:w-[310px] flex-shrink-0 h-full flex flex-col"
                >
                  <ApplicationColumn
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
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeApp ? (
                <div className="bg-white border border-gray-200 rounded-[12px] shadow-2xl w-[270px] sm:w-[290px] p-2.5 rotate-[1.5deg] scale-[1.02] cursor-grabbing pointer-events-none">
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
      </div>

      {/* 3. Hint Scroll */}
      {!isLoading && isScrollable && (
        <div className="flex justify-end w-full px-2 flex-shrink-0 -mt-1">
          <p className="text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-1 italic">
            Mẹo: Giữ
            <kbd className="font-sans font-bold border border-gray-200 rounded px-1 bg-gray-50 text-[9px] not-italic text-gray-600">
              Shift
            </kbd>
            + cuộn chuột ngang
          </p>
        </div>
      )}

      {/* Modals */}
      {closeAppTarget && (
        <div
          className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setCloseAppTarget(null)}
        >
          <div
            className="bg-white w-full max-w-[420px] rounded-[18px] shadow-2xl p-5 relative animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">Đóng hồ sơ nhận nuôi?</h3>
            <p className="text-[13px] text-gray-600 mb-3 leading-relaxed">
              Bạn có chắc chắn muốn đóng đơn của{' '}
              <strong className="text-gray-900">{closeAppTarget.fullName || closeAppTarget.user?.name}</strong>{' '}
              cho bé <strong className="text-gray-900">{closeAppTarget.pet?.name}</strong>?
            </p>
            <div className="mb-4">
              <label className="text-[11px] font-medium text-gray-500 mb-1 block">Lý do đóng:</label>
              <textarea
                rows={2}
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                placeholder="Nhập lý do..."
                className="w-full border border-gray-200 rounded-[8px] p-2 text-[12px] outline-none focus:border-red-400"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCloseAppTarget(null)}
                disabled={isClosingApp}
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[12px] font-semibold rounded-md"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={isClosingApp}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded-md disabled:opacity-60"
              >
                {isClosingApp ? 'Đang đóng...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => { setSelectedApp(null); fetchApplications(); }}
        />
      )}
      {profileApp && <ApplicantProfileModal application={profileApp} onClose={() => setProfileApp(null)} />}
      {documentsApp && <AllDocumentsModal application={documentsApp} onClose={() => setDocumentsApp(null)} />}
      {pendingApp && (
        <MoveToPendingModal
          application={pendingApp}
          onClose={() => { setPendingApp(null); fetchApplications(); }}
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
          onClose={() => { setQuickViewApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
        />
      )}
      {interviewApp && (
        <InterviewScheduleModal
          application={interviewApp}
          onClose={() => { setInterviewApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
          onSubmit={async (data) => {
            const res = await applicationService.scheduleAppointment(interviewApp.id, data);
            await fetchApplications();
            setInterviewApp(null);
            return res;
          }}
        />
      )}
      {approveApp && (
        <ApproveApplicationModal
          application={approveApp}
          onClose={() => { setApproveApp(null); fetchApplications(); }}
          onRefresh={fetchApplications}
          onCompleteAdoption={handleCompleteAdoption}
          onScheduleInterview={async (id, d) => {
            const res = await applicationService.scheduleAppointment(id, d);
            await fetchApplications();
            return res;
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
          onClose={() => { setRequestDocsApp(null); fetchApplications(); }}
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
          onClose={() => { setNeedInfoApp(null); setPendingRequiredDocs([]); fetchApplications(); }}
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
          height: 5px;
        }
        .custom-board-scroll::-webkit-scrollbar-thumb {
          background-color: #E89B5A;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};