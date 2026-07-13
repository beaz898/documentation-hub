'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCreditCost } from '@/lib/credits';

const MAX_SELECTION = 20;
const ANALYSIS_ENDPOINT = '/api/analyze-v2';

export interface ReviewAnalysisSummary {
  hasDetail: boolean;
  recommendation: 'INDEXAR' | 'REVISAR' | 'NO_INDEXAR' | null;
  analyzedAt: string;
  counts: {
    contradictions: number;
    contradictionsConfirmed: number;
    minorInconsistencies: number;
    duplicates: number;
    overlaps: number;
    styleProblems: number;
  };
}

export interface ReviewDocument {
  id: string;
  name: string;
  source: string;
  folder_path: string | null;
  folder_id: string | null;
  analysis_status: string;
  created_at: string;
  lastAnalysis: ReviewAnalysisSummary | null;
}

export interface ReviewFolderGroup {
  folderPath: string | null;
  documents: ReviewDocument[];
}

export function useReviewList() {
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/documents/review-list', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}`);
      }
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
    } catch (err) {
      console.error('[useReviewList] fetch:', err);
      setError('No se pudo cargar la lista de documentos por revisar.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // Recarga y limpia la seleccion (nueva tanda desde cero).
  const refetch = useCallback(async () => {
    setSelectedIds(new Set());
    await fetchList();
  }, [fetchList]);

  // Agrupacion por carpeta (los de "/" o null van a un grupo folderPath: null).
  const groups = useMemo<ReviewFolderGroup[]>(() => {
    const byFolder = new Map<string, ReviewDocument[]>();
    const NO_FOLDER = '__NO_FOLDER__'; // clave interna para "sin carpeta"
    for (const doc of documents) {
      const raw = doc.folder_path;
      const key = !raw || raw === '/' ? NO_FOLDER : raw;
      const arr = byFolder.get(key);
      if (arr) arr.push(doc);
      else byFolder.set(key, [doc]);
    }
    const result: ReviewFolderGroup[] = [];
    for (const [key, docs] of byFolder) {
      result.push({ folderPath: key === NO_FOLDER ? null : key, documents: docs });
    }
    // "Sin carpeta" al final; el resto por nombre de carpeta.
    result.sort((a, b) => {
      if (a.folderPath === null) return 1;
      if (b.folderPath === null) return -1;
      return a.folderPath.localeCompare(b.folderPath);
    });
    return result;
  }, [documents]);

  const limitReached = selectedIds.size >= MAX_SELECTION;

  const toggleDocument = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTION) {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Selecciona todos los de una carpeta hasta agotar el limite global.
  const toggleFolder = useCallback(
    (folderPath: string | null) => {
      setSelectedIds((prev) => {
        const group = groups.find((g) => g.folderPath === folderPath);
        if (!group) return prev;
        const groupIds = group.documents.map((d) => d.id);
        const allSelected = groupIds.every((id) => prev.has(id));
        const next = new Set(prev);
        if (allSelected) {
          // Deseleccionar la carpeta entera.
          for (const id of groupIds) next.delete(id);
        } else {
          // Seleccionar hasta el limite.
          for (const id of groupIds) {
            if (next.size >= MAX_SELECTION) break;
            next.add(id);
          }
        }
        return next;
      });
    },
    [groups],
  );

  // Selecciona los primeros MAX_SELECTION de toda la lista (o deselecciona todo).
  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size > 0) return new Set();
      const next = new Set<string>();
      for (const doc of documents) {
        if (next.size >= MAX_SELECTION) break;
        next.add(doc.id);
      }
      return next;
    });
  }, [documents]);

  const selectedCount = selectedIds.size;
  const estimatedCost = selectedCount * getCreditCost(ANALYSIS_ENDPOINT, false);
  const totalPending = documents.length;

  return {
    groups,
    loading,
    error,
    selectedIds,
    selectedCount,
    estimatedCost,
    limitReached,
    totalPending,
    maxSelection: MAX_SELECTION,
    toggleDocument,
    toggleFolder,
    toggleAll,
    refetch,
  };
}
