"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Circle,
  FileText,
  Download,
  ChevronLeft,
} from "lucide-react";

import LessonPlayer from "@/app/franqueado/academy/components/LessonPlayer";
import LessonSidebar from "@/app/franqueado/academy/components/LessonSidebar";
import { useCurso, useAula, completeLesson } from "@/hooks/useApi";

interface LessonPageProps {
  params: { courseSlug: string; lessonSlug: string };
}

export default function LessonPage({ params }: LessonPageProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const { courseSlug, lessonSlug } = params;

  const { data: curso, loading: cursoLoading, error: cursoError, refetch: refetchCurso } = useCurso(courseSlug);
  const { data: aulaAtual, loading: aulaLoading, error: aulaError, refetch: refetchAula } = useAula(lessonSlug);

  const [showSidebar, setShowSidebar] = useState(true);
  const [marcando, setMarcando] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Proteção de rota
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/franqueado");
    }
  }, [isAuthenticated, authLoading, router]);

  if (cursoLoading || aulaLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300">
        Carregando conteúdo...
      </div>
    );
  }

  if (cursoError || aulaError) {
    return (
      <div className="p-6 text-red-400">
        Erro ao carregar dados: {cursoError || aulaError}
      </div>
    );
  }

  if (!curso) {
    return <div className="p-6 text-white">Curso não encontrado</div>;
  }

  if (!aulaAtual) {
    return <div className="p-6 text-white">Aula não encontrada</div>;
  }
  // Encontrar módulo atual
  const moduloAtual = curso.modulos?.find((m: any) =>
    m.aulas.some((a: any) => a.slug === aulaAtual.slug)
  );

  // Encontrar aulas anterior e próxima
  const todasAulas = curso.modulos?.flatMap((m: any) => m.aulas) || [];
  const aulaIndex = todasAulas.findIndex((a: any) => a.slug === aulaAtual.slug);
  const aulaAnterior = aulaIndex > 0 ? todasAulas[aulaIndex - 1] : null;
  const proximaAula =
    aulaIndex < todasAulas.length - 1 ? todasAulas[aulaIndex + 1] : null;

  // Função para marcar aula como concluída
  const handleMarkComplete = async () => {
    try {
      setMarcando(true);

      // 1. Atualiza otimisticamente (UI responde rápido)
      if (aulaAtual.progresso) {
        aulaAtual.progresso.concluida = true;
      }

      // 2. Faz a requisição
      await completeLesson(aulaAtual.slug);

      // 3. ✅ RECARREGA AMBOS (em paralelo para ser mais rápido)
      await Promise.all([
        refetchAula(),
        refetchCurso()
      ]);

    } catch (err) {
      console.error("Erro ao marcar aula:", err);
      // Reverte a mudança otimista em caso de erro
      if (aulaAtual.progresso) {
        aulaAtual.progresso.concluida = false;
      }
    } finally {
      setMarcando(false);
    }
  };


  // Aula concluida - bool
  const concluida = aulaAtual.progresso?.concluida || false;

  // Mostrar botão de concluir apenas nos instantes finais (≥90% ou ≤30s restantes)
  const isNearEnd =
    concluida ||
    (videoDuration > 0 &&
      (videoCurrentTime / videoDuration >= 0.9 ||
        videoDuration - videoCurrentTime <= 30));


  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="flex">
        <main className="flex-1 flex">
          {/* Conteúdo Principal */}
          <div
            className={`flex-1 transition-all duration-300 ${showSidebar ? "mr-96" : "mr-0"
              }`}
          >
            {/* Header da Aula */}
            <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 p-4 flex justify-between">
              <Link
                href={`/franqueado/academy/cursos/${curso.slug}`}
                className="flex items-center gap-2 text-gray-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" /> Voltar ao curso
              </Link>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Conteúdo
              </button>
            </div>

            {/* Player */}
            <LessonPlayer
              curso={curso}
              aulaAtual={aulaAtual}
              aulaAnterior={aulaAnterior}
              proximaAula={proximaAula}
              courseSlug={courseSlug}
              onProgressChange={(current, total) => {
                setVideoCurrentTime(current);
                setVideoDuration(total);
              }}
            />

            {/* Informações da Aula */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">
                  {aulaAtual.titulo}
                </h2>
                {/* Botão só aparece nos instantes finais ou se já concluída */}
                {isNearEnd && (
                  <button
                    onClick={handleMarkComplete}
                    disabled={marcando || concluida}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-500 ${concluida
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-brand-pink hover:bg-brand-pink/90 text-white animate-pulse"
                      }`}
                  >
                    {concluida ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Concluída
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" /> Marcar como concluída
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-gray-400 mb-4">
                <span>Módulo: {moduloAtual?.titulo}</span>
                <span>•</span>
                <span>Duração: {aulaAtual.duracao}</span>
              </div>

              {/* Materiais */}
              {aulaAtual.materiais?.length > 0 && (
                <div className="bg-white/5 p-6 rounded-xl mb-6">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Materiais de Apoio
                  </h3>
                  <div className="space-y-3">
                    {aulaAtual.materiais.map((material: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <span className="text-white font-medium">
                          {material.tipo?.toUpperCase()}
                        </span>
                        <a
                          href={material.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-brand-pink"
                        >
                          <Download className="w-4 h-4" /> Acessar
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar de Conteúdo */}
          <LessonSidebar
            curso={curso}
            courseSlug={courseSlug}
            currentLessonSlug={lessonSlug}
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
          />
        </main>
      </div>
    </div>
  );
}