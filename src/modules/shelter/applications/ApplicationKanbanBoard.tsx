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
import { ApplicationCardContent } from './components/ApplicationCard';
import { ApplicationDetailModal } from './components/ApplicationDetailModal';
import { ApplicationFilterBar } from './components/ApplicationFilterBar';
import { ApplicantProfileModal } from '@/components/ApplicantProfileModal';
import { AllDocumentsModal } from './components/AllDocumentsModal';

export const ApplicationKanbanBoard: React.FC = () => {
  const { items, isLoading, movingIds } = useApplicationList();
  const { fetchApplications, moveApplication } = useApplicationActions();

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
      setSelectedApp(app);
      return;
    }

    moveApplication(app.id, nextStatus);
  };

  return (
    // Tăng max-w lên 1536px (2xl) hoặc full để 5 cột có không gian thở, hoặc bạn giữ 1318px tùy thiết kế
    <div className="flex flex-col justify-start gap-[40px] w-full overflow-hidden">

      {/* --- HEADER --- */}
      <div className="flex justify-between w-full">
        <h1 className="font-['Be Vietnam Pro',_sans-serif] text-[40px] text-[#0D062D] font-semibold tracking-tight">
          Quản lý hồ sơ nhận nuôi
        </h1>
        <ApplicationFilterBar />
      </div>
      {/* -------------- */}

      {isLoading && items.length === 0 ? (
        <div className="flex gap-[11px] w-full h-[741px] overflow-hidden">
          {/* Đổi thành 5 Skeleton và tính toán chiều rộng bằng calc() */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-[calc((100%-44px)/5)] shrink-0 h-full rounded-[18px] bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Vùng chứa Columns */}
          <div className="flex gap-[11px] overflow-x-auto pb-4 items-stretch scroll-smooth w-full min-h-[741px]">
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
                onRemove={(app) => console.log("Xoá ticket ID: ", app.id)}
                onOpenDocuments={(app) => setDocumentsApp(app)}
              />
            ))}
          </div>

          {/* Hiệu ứng khi kéo thẻ */}
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

      {/* Modals */}
      {selectedApp && (
        <ApplicationDetailModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
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
    </div>
  );
};