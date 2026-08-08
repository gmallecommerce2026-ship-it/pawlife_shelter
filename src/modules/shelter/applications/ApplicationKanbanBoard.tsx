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
import { useApplicationList, useApplicationActions, useApplicationFilter, selectFilteredApplications } from '@/stores/useApplicationStore';
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

const isColumnId = (id: string | number) =>
  KANBAN_COLUMNS.some((c) => c.status === id);

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { filter } = useApplicationFilter();
  const { fetchApplications, moveApplication } = useApplicationActions();

  const [quickViewApp, setQuickViewApp] = useState<AdoptionApplication | null>(null);
  const [localItems, setLocalItems] = useState<AdoptionApplication[]>(items);
  const isDraggingRef = useRef(false);

  // States quản lý Modal chuyển trạng thái
  const [approveApp, setApproveApp] = useState<AdoptionApplication | null>(null);
  const [interviewApp, setInterviewApp] = useState<AdoptionApplication | null>(null);
  const [needInfoApp, setNeedInfoApp] = useState<AdoptionApplication | null>(null);
  const [pendingApp, setPendingApp] = useState<AdoptionApplication | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  // ĐỒNG BỘ: Phẳng hóa mảng Tags từ Backend
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
    setActiveApp(null);
    setOverColumn(null);

    const activeId = active.id as string;
    const originalItem = items.find((a) => a.id === activeId);
    if (!over || !originalItem) {
      setLocalItems(items);
      return;
    }

    const finalItem = localItems.find((a) => a.id === activeId);
    if (!finalItem || finalItem.status === originalItem.status) return;

    // 1. Chuyển từ Mới -> Đang xem xét (PENDING)
    if (finalItem.status === 'PENDING' && originalItem.status === 'SUBMITTED') {
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setPendingApp(originalItem);
      return;
    }

    // 2. Chuyển sang Yêu cầu bổ sung (NEED_MORE_INFO)
    if (finalItem.status === 'NEED_MORE_INFO') {
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setNeedInfoApp(originalItem);
      return;
    }

    // 3. Chuyển sang Hẹn phỏng vấn (INTERVIEW_SCHEDULED)
    if (finalItem.status === 'INTERVIEW_SCHEDULED') {
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setInterviewApp(originalItem);
      return;
    }

    // 4. Cho phép kéo từ BẤT KỲ cột nào sang ĐÃ DUYỆT (APPROVED)
    if (finalItem.status === 'APPROVED') {
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setApproveApp(originalItem);
      return;
    }

    if (REQUIRES_CONFIRM.includes(finalItem.status)) {
      setLocalItems((prev) => prev.map((a) => (a.id === activeId ? { ...a, status: originalItem.status } : a)));
      setSelectedApp(originalItem);
      return;
    }

    moveApplication(activeId, finalItem.status);
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
                onOpenProfile={(app) => setProfileApp(app)}
                onRemove={(app) => console.log("Xóa ticket ID: ", app.id)}
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
          onRefresh={fetchApplications}   // 👈 thêm dòng này
        />
      )}


      {interviewApp && (
        <InterviewScheduleModal
          application={interviewApp}
          onClose={() => {
            setInterviewApp(null);
            fetchApplications();
          }}
          onSubmit={async (data) => {
            await moveApplication(interviewApp.id, 'INTERVIEW_SCHEDULED', data?.reviewNote);
            await fetchApplications();
            setInterviewApp(null);
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
          onRefresh={fetchApplications}   // 👈 thêm dòng này
          onSubmit={async (data) => {
            await moveApplication(approveApp.id, 'APPROVED', data?.reviewNote);
            await fetchApplications();
            setApproveApp(null);
          }}
        />
      )}

      {needInfoApp && (
        <NeedMoreInfoModal
          application={needInfoApp}
          onClose={() => {
            setNeedInfoApp(null);
            fetchApplications();
          }}
          onRefresh={fetchApplications}   // 👈 thêm dòng này
          onSubmit={async (data) => {
            await moveApplication(needInfoApp.id, 'NEED_MORE_INFO', data?.reviewNote);
            await fetchApplications();
            setNeedInfoApp(null);
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