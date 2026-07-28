'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PetForm } from '@/modules/shelter/pets/components/PetForm';
import { usePetActions } from '@/stores/usePetStore';
import { Pet } from '@/types/pet';

export default function EditPetPage() {
  const params = useParams<{ id: string }>();
  const { getPetById } = usePetActions();
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const result = await getPetById(params.id);
      if (mounted) {
        setPet(result);
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (isLoading) {
    return <div className="w-full max-w-[900px] py-20 text-center text-gray-400">Đang tải thông tin pet...</div>;
  }

  if (!pet) {
    return <div className="w-full max-w-[900px] py-20 text-center text-gray-500">Không tìm thấy pet này.</div>;
  }

  return <PetForm mode="edit" initialPet={pet} />;
}
