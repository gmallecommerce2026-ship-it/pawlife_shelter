'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KANBAN_COLUMNS, ApplicationStatus, AdoptionApplication } from '@/types/application';
import { useApplicationList, useApplicationActions } from '@/stores/useApplicationStore';
import { ApplicationColumn } from './components/ApplicationColumn';
import { ApplicationCard, ApplicationCardContent } from './components/ApplicationCard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { ApplicationFilterBar } from './components/ApplicationFilterBar';

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { fetchApplications, moveApplication } = useApplicationActions();

  const [activeApp, setActiveApp] = useState<AdoptionApplication | null>(null);
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(null);
  const [openRejectFormOnSelect, setOpenRejectFormOnSelect] = useState(false);
  const [overColumn, setOverColumn] = useState<ApplicationStatus | null>(null);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const REQUIRES_CONFIRM: ApplicationStatus[] = ['CLOSED'];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns = useMemo(
    () =>
      KANBAN_COLUMNS.map((col) => ({
        ...col,
        applications: items.filter((a) => a.status === col.status),
      })),
    [items]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const app = items.find((a) => a.id === event.active.id);
    setActiveApp(app ?? null);
  };

  const handleDragOver = (event: any) => {
    const overId = event.over?.id as ApplicationStatus | undefined;
    setOverColumn(overId ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveApp(null);
    setOverColumn(null);
    if (!over) return;

    const app = items.find((a) => a.id === active.id);
    const nextStatus = over.id as ApplicationStatus;
    if (!app || app.status === nextStatus) return;

    if (REQUIRES_CONFIRM.includes(nextStatus)) {
      setOpenRejectFormOnSelect(true);
      setSelectedApp(app);
      return;
    }

    moveApplication(app.id, nextStatus);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="font-sans text-2xl text-[#123832] font-bold mb-1">Đơn nhận nuôi</h1>
          <p className="text-sm text-gray-500">
            Kéo thả thẻ đơn để chuyển trạng thái xử lý, hoặc bấm vào thẻ để xem chi tiết.
          </p>
        </div>
      </div>

      <ApplicationFilterBar />

      {isLoading && items.length === 0 ? (
        <div className="flex gap-4 pb-4" style={{ height: 'calc(100vh - 260px)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[280px] flex-shrink-0 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div
            className="flex gap-4 overflow-x-auto pb-4 items-stretch scroll-smooth"
            style={{ height: 'calc(100vh - 260px)' }}
          >
            {columns.map((col) => (
              <ApplicationColumn
                key={col.status}
                status={col.status}
                label={col.label}
                applications={col.applications}
                movingIds={movingIds}
                isDropTarget={overColumn === col.status && activeApp?.status !== col.status}
                onCardClick={(app) => {
                  setOpenRejectFormOnSelect(false);
                  setSelectedApp(app);
                }}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 220,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activeApp ? (
              <div className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-2xl w-[264px] rotate-[2deg] scale-[1.03] cursor-grabbing">
                <ApplicationCardContent application={activeApp} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          initialShowRejectForm={openRejectFormOnSelect}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
};