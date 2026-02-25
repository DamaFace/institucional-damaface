"use client";

import Link from "next/link";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Maximize,
  Minimize,
  Volume2,
  FileText
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Aula, Curso } from "@/types/academy";

// Declaração global para a API do YouTube
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface LessonPlayerProps {
  curso: Curso;
  aulaAtual: Aula;
  aulaAnterior?: Aula | null;
  proximaAula?: Aula | null;
  courseSlug: string;
  onProgressChange?: (currentTime: number, duration: number) => void;
}

export default function LessonPlayer({
  curso,
  aulaAtual,
  aulaAnterior,
  proximaAula,
  courseSlug,
  onProgressChange,
}: LessonPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isAPIReady, setIsAPIReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);


  // Função para validar o formato do video_id do YouTube
  const validateVideoId = (videoId: string | undefined): boolean => {
    if (!videoId || typeof videoId !== 'string') {
      return false;
    }
    // YouTube video IDs são geralmente 11 caracteres alfanuméricos
    // Mas podem ter variações, então validamos se não está vazio e tem pelo menos 1 caractere
    const trimmedId = videoId.trim();
    if (trimmedId.length === 0) {
      return false;
    }
    // Validação básica: deve conter apenas caracteres alfanuméricos, hífens e underscores
    // e ter entre 1 e 20 caracteres (formato típico do YouTube)
    return /^[a-zA-Z0-9_-]{1,20}$/.test(trimmedId);
  };

  if (!aulaAtual.video_id) {
    return (
      <div className="relative bg-black aspect-video flex flex-col items-center justify-center text-center p-8">
        <FileText className="w-16 h-16 text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-white">Esta aula é focada em materiais</h3>
        <p className="text-gray-400 mt-2">
          Não há vídeo para esta lição. Verifique a seção de "Materiais de Apoio" abaixo para acessar os conteúdos.
        </p>
      </div>
    );
  }

  // Validar o video_id antes de usar - definir erro inicial se inválido
  useEffect(() => {
    if (aulaAtual.video_id && !validateVideoId(aulaAtual.video_id)) {
      const errorMessage = `Video ID inválido: "${aulaAtual.video_id}". O ID do vídeo deve ser uma string válida do YouTube.`;
      console.error(errorMessage);
      setVideoError(errorMessage);
      // Lançar exceção de forma assíncrona para travar a aplicação
      setTimeout(() => {
        throw new Error(errorMessage);
      }, 0);
    }
  }, [aulaAtual.video_id]);

  // Carregar a API do YouTube
  useEffect(() => {
    // Verificar se a API já foi carregada
    if (window.YT && window.YT.Player) {
      setIsAPIReady(true);
      return;
    }

    // Carregar o script da API do YouTube
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    // Callback global quando a API estiver pronta
    window.onYouTubeIframeAPIReady = () => {
      setIsAPIReady(true);
    };

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Função para formatar tempo em MM:SS ou HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Mostrar/ocultar controles com auto-hide em mobile
  const revealControls = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Limpar timer de auto-hide ao desmontar
  useEffect(() => {
    return () => {
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  // Atualizar informações do vídeo
  const updateVideoInfo = () => {
    if (!player) return;

    try {
      const current = player.getCurrentTime();
      const total = player.getDuration();

      setCurrentTime(current);
      setDuration(total);
      setProgress(total > 0 ? (current / total) * 100 : 0);

      // Notificar componente pai sobre progresso
      if (onProgressChange) {
        onProgressChange(current, total);
      }
    } catch (error) {
      console.log('Erro ao obter informações do vídeo:', error);
    }
  };

  // Iniciar/parar monitoramento do tempo
  useEffect(() => {
    if (player && isPlaying) {
      // Atualizar a cada segundo quando estiver reproduzindo
      intervalRef.current = setInterval(updateVideoInfo, 1000);
    } else {
      // Limpar intervalo quando pausado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [player, isPlaying]);
  useEffect(() => {
    if (isAPIReady && playerRef.current && !player && aulaAtual.video_id) {
      // Validar novamente antes de criar o player
      if (!validateVideoId(aulaAtual.video_id)) {
        const errorMessage = `Video ID inválido: "${aulaAtual.video_id}". Não é possível carregar o vídeo.`;
        console.error(errorMessage);
        setVideoError(errorMessage);
        // Lançar exceção de forma assíncrona para travar a aplicação
        setTimeout(() => {
          throw new Error(errorMessage);
        }, 0);
        return;
      }

      try {
        const ytPlayer = new window.YT.Player(playerRef.current, {
          videoId: aulaAtual.video_id.trim(),
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 0, // Remove controles do YouTube
            disablekb: 1, // Desabilita controles do teclado
            fs: 0, // Remove botão de fullscreen do YouTube
            iv_load_policy: 3, // Remove anotações
            modestbranding: 1, // Remove logo do YouTube
            rel: 0, // Remove vídeos relacionados
            showinfo: 0, // Remove informações do vídeo
          },
          events: {
            onReady: (event: any) => {
              setPlayer(event.target);
              setVideoError(null); // Limpar erro se o vídeo carregar com sucesso
              // Obter duração inicial quando o vídeo carregar
              setTimeout(() => {
                updateVideoInfo();
              }, 1000);
            },
            onStateChange: (event: any) => {
              // 1 = playing, 2 = paused
              const playing = event.data === 1;
              setIsPlaying(playing);

              // Atualizar informações imediatamente quando o estado mudar
              if (playing) {
                updateVideoInfo();
              }
            },
            onError: (event: any) => {
              // Códigos de erro do YouTube Player API:
              // 2 = O valor do parâmetro de solicitação inválido
              // 5 = O conteúdo HTML5 do player não pode ser encontrado
              // 100 = O vídeo solicitado não foi encontrado
              // 101 = O proprietário do vídeo não permite a reprodução em players incorporados
              // 150 = O proprietário do vídeo não permite a reprodução em players incorporados
              const errorCode = event.data;
              let errorMessage = `Erro ao carregar o vídeo (Código: ${errorCode}). `;

              switch (errorCode) {
                case 2:
                  errorMessage += `Video ID inválido: "${aulaAtual.video_id}". O ID fornecido não é válido.`;
                  break;
                case 100:
                  errorMessage += `O vídeo com ID "${aulaAtual.video_id}" não foi encontrado no YouTube.`;
                  break;
                case 101:
                case 150:
                  errorMessage += `O vídeo com ID "${aulaAtual.video_id}" não permite reprodução em players incorporados.`;
                  break;
                case 5:
                  errorMessage += `Erro ao carregar o player HTML5.`;
                  break;
                default:
                  errorMessage += `Erro desconhecido ao carregar o vídeo.`;
              }

              console.error('Erro no YouTube Player:', errorMessage);
              setVideoError(errorMessage);
              // Lançar exceção de forma assíncrona para travar a aplicação
              setTimeout(() => {
                throw new Error(errorMessage);
              }, 0);
            },
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : `Erro ao inicializar o player do YouTube para o vídeo ID: "${aulaAtual.video_id}"`;
        console.error(errorMessage, error);
        setVideoError(errorMessage);
        // Lançar exceção de forma assíncrona para travar a aplicação
        setTimeout(() => {
          throw error instanceof Error ? error : new Error(errorMessage);
        }, 0);
      }
    }
  }, [isAPIReady, aulaAtual.video_id]);

  // Atualizar vídeo quando a aula mudar
  useEffect(() => {
    if (player && aulaAtual.video_id) {
      // Validar antes de carregar
      if (!validateVideoId(aulaAtual.video_id)) {
        const errorMessage = `Video ID inválido: "${aulaAtual.video_id}". Não é possível carregar o vídeo.`;
        console.error(errorMessage);
        setVideoError(errorMessage);
        // Lançar exceção de forma assíncrona para travar a aplicação
        setTimeout(() => {
          throw new Error(errorMessage);
        }, 0);
        return;
      }

      try {
        player.loadVideoById(aulaAtual.video_id.trim());
        // Reset dos valores quando trocar de vídeo
        setCurrentTime(0);
        setDuration(0);
        setProgress(0);
        setVideoError(null); // Limpar erro anterior
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : `Erro ao carregar o vídeo com ID: "${aulaAtual.video_id}"`;
        console.error(errorMessage, error);
        setVideoError(errorMessage);
        // Lançar exceção de forma assíncrona para travar a aplicação
        setTimeout(() => {
          throw error instanceof Error ? error : new Error(errorMessage);
        }, 0);
      }
    }
  }, [player, aulaAtual.video_id]);

  // Controles de reprodução
  const handlePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  // Controle de tela cheia
  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // Entrar em tela cheia
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    } else {
      // Sair da tela cheia
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  // Escutar mudanças no estado de tela cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative bg-black ${isFullscreen ? 'w-screen h-screen' : 'aspect-video'}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Player Container */}
      <div className="absolute inset-0 w-full h-full">
        {videoError ? (
          // Exibir erro se houver problema com o video_id
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 text-center p-8">
            <div className="text-red-400 text-xl font-semibold mb-4">Erro ao carregar vídeo</div>
            <div className="text-red-300 text-sm mb-2">{videoError}</div>
            <div className="text-red-200 text-xs mt-4">
              Por favor, verifique se o Video ID está correto e se o vídeo existe no YouTube.
            </div>
          </div>
        ) : !isAPIReady ? (
          // Loading placeholder
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-white">Carregando player...</div>
          </div>
        ) : (
          // YouTube Player
          <div ref={playerRef} className="w-full h-full" />
        )}
      </div>

      {/* Controles Customizados */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 lg:p-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'
          }`}
      >
        {/* Barra de Progresso */}
        <div className="mb-4">
          <div className="w-full bg-white/20 rounded-full h-1 cursor-pointer">
            <div
              className="bg-brand-pink h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          {/* Tempo Atual / Duração Total */}
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Controles de Navegação e Reprodução */}
          <div className="flex items-center gap-2 lg:gap-4">
            {aulaAnterior && (
              <Link
                href={`/franqueado/academy/cursos/${courseSlug}/${aulaAnterior.slug}`}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="Aula anterior"
              >
                <SkipBack className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </Link>
            )}

            <button
              onClick={handlePlayPause}
              disabled={!player}
              className="p-2 lg:p-3 bg-brand-pink hover:bg-brand-pink/90 rounded-full transition-colors disabled:opacity-50"
              title={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              ) : (
                <Play className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              )}
            </button>

            {proximaAula && (
              <Link
                href={`/franqueado/academy/cursos/${courseSlug}/${proximaAula.slug}`}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                title="Próxima aula"
              >
                <SkipForward className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </Link>
            )}
          </div>

          {/* Informações e Controles Direitos */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Tempo Detalhado (visível apenas em telas maiores) */}
            <div className="hidden lg:flex items-center gap-2 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            {/* Duração Original (fallback mobile) */}
            <div className="flex lg:hidden items-center gap-2 text-white text-sm">
              <Clock className="w-4 h-4" />
              <span>{duration > 0 ? formatTime(duration) : aulaAtual.duracao}</span>
            </div>

            {/* Botão de Tela Cheia */}
            <button
              onClick={handleFullscreen}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              ) : (
                <Maximize className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Título da Aula (apenas em tela cheia) */}
        {isFullscreen && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <h3 className="text-white text-lg font-semibold">{aulaAtual.titulo}</h3>
            <p className="text-gray-300 text-sm">
              {curso.titulo} • Módulo {aulaAtual.id}
            </p>
          </div>
        )}
      </div>

      {/* Overlay para mostrar/ocultar controles no mobile ao tocar */}
      <div
        className="absolute inset-0 lg:hidden"
        onClick={() => {
          if (showControls) {
            // Se controles estão visíveis e player existe, play/pause ao clicar
            if (player) {
              handlePlayPause();
            }
            revealControls();
          } else {
            // Mostrar controles
            revealControls();
          }
        }}
      />
    </div>
  );
}