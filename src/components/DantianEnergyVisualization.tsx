import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Cultivator, Meridian, ElementType } from '../types/game';

interface DantianVisualizationProps {
  cultivator: Cultivator;
  onSelectMeridian?: (meridianId: string) => void;
}

export const DantianEnergyVisualization: React.FC<DantianVisualizationProps> = ({
  cultivator,
  onSelectMeridian,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{
    meridian: Meridian;
    x: number;
    y: number;
  } | null>(null);

  const elementColors: Record<ElementType, string> = {
    Fuego: '#f97316',
    Agua: '#06b6d4',
    Madera: '#10b981',
    Tierra: '#eab308',
    Rayo: '#a855f7',
    Viento: '#38bdf8',
    Caos: '#ef4444',
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 420;
    const height = 480;
    const centerX = width / 2;
    const centerY = height / 2 + 20;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Dantian core radial glow
    const coreGradient = defs.append('radialGradient')
      .attr('id', 'dantianCoreGlow')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');

    coreGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#fef08a')
      .attr('stop-opacity', 0.95);

    coreGradient.append('stop')
      .attr('offset', '45%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.7);

    coreGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#d97706')
      .attr('stop-opacity', 0.0);

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'qiGlow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');

    // Human silhouette outline / spiritual meridian vessel background
    const silhouettePath = `
      M ${centerX} 60
      C ${centerX - 22} 60, ${centerX - 24} 85, ${centerX - 20} 105
      C ${centerX - 45} 125, ${centerX - 75} 150, ${centerX - 80} 190
      C ${centerX - 85} 230, ${centerX - 70} 270, ${centerX - 65} 320
      C ${centerX - 60} 370, ${centerX - 45} 410, ${centerX - 40} 450
      L ${centerX + 40} 450
      C ${centerX + 45} 410, ${centerX + 60} 370, ${centerX + 65} 320
      C ${centerX + 70} 270, ${centerX + 85} 230, ${centerX + 80} 190
      C ${centerX + 75} 150, ${centerX + 45} 125, ${centerX + 20} 105
      C ${centerX + 24} 85, ${centerX + 22} 60, ${centerX} 60
      Z
    `;

    g.append('path')
      .attr('d', silhouettePath)
      .attr('fill', '#0d131f')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.85);

    // Dantian core energy saturation radius
    const saturationRatio = Math.min(1, cultivator.qi / cultivator.maxQi);
    const coreRadius = 24 + saturationRatio * 20;

    // Draw orbital rings around Dantian
    for (let r = 1; r <= 3; r++) {
      g.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', 32 + r * 16)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', `${r * 4},${r * 3}`)
        .attr('opacity', 0.25 + saturationRatio * 0.35);
    }

    // Nodes positions for the 8 Extraordinary Meridians along human energy channels
    const meridianPositions: Record<string, { x: number; y: number }> = {
      meridian_du: { x: centerX, y: 85 }, // Du Mai (Head / Crown - Baihui)
      meridian_ren: { x: centerX, y: 175 }, // Ren Mai (Chest / Danzhong)
      meridian_chong: { x: centerX, y: 225 }, // Chong Mai (Central Qi core)
      meridian_dai: { x: centerX + 55, y: centerY }, // Dai Mai (Belt meridian right)
      meridian_yangqiao: { x: centerX - 55, y: centerY }, // Yang Qiao (Belt left)
      meridian_yinqiao: { x: centerX - 40, y: 360 }, // Yin Qiao (Left leg)
      meridian_yangwei: { x: centerX + 40, y: 360 }, // Yang Wei (Right leg)
      meridian_yinwei: { x: centerX, y: 410 }, // Yin Wei (Root / Huiyin)
    };

    // Draw energy connection conduits from Dantian to each Meridian node
    cultivator.meridians.forEach((meridian) => {
      const pos = meridianPositions[meridian.id];
      if (!pos) return;

      const pathData = `M ${centerX} ${centerY} Q ${(centerX + pos.x) / 2 + (pos.x > centerX ? 15 : -15)} ${(centerY + pos.y) / 2} ${pos.x} ${pos.y}`;

      const conduit = g.append('path')
        .attr('d', pathData)
        .attr('fill', 'none')
        .attr('stroke', meridian.unlocked ? elementColors[meridian.elementAffinity] : '#334155')
        .attr('stroke-width', meridian.unlocked ? 2.5 : 1)
        .attr('opacity', meridian.unlocked ? 0.85 : 0.3)
        .attr('stroke-dasharray', meridian.unlocked ? '6,3' : '3,3');

      if (meridian.unlocked) {
        conduit.attr('filter', 'url(#qiGlow)');
      }
    });

    // Central Dantian Orb
    const dantianGroup = g.append('g')
      .attr('class', 'cursor-pointer');

    // Outer Qi Aura
    dantianGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', coreRadius + 14)
      .attr('fill', 'url(#dantianCoreGlow)')
      .attr('opacity', 0.6);

    // Inner Solid Core
    dantianGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', coreRadius)
      .attr('fill', '#f59e0b')
      .attr('filter', 'url(#qiGlow)')
      .attr('opacity', 0.9);

    // Core Center Sparkle
    dantianGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', coreRadius * 0.45)
      .attr('fill', '#fffbeb');

    // Text inside Dantian
    dantianGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'Cinzel, serif')
      .attr('font-weight', 'bold')
      .attr('fill', '#78350f')
      .text('丹田');

    // Render interactive meridian acupoint nodes
    cultivator.meridians.forEach((meridian) => {
      const pos = meridianPositions[meridian.id];
      if (!pos) return;

      const nodeGroup = g.append('g')
        .attr('class', 'cursor-pointer transition-transform')
        .on('mouseenter', (event) => {
          const [x, y] = d3.pointer(event, svgRef.current);
          setHoveredNode({ meridian, x, y });
        })
        .on('mouseleave', () => {
          setHoveredNode(null);
        })
        .on('click', () => {
          if (onSelectMeridian) {
            onSelectMeridian(meridian.id);
          }
        });

      // Outer pulse ring if unlocked
      if (meridian.unlocked) {
        nodeGroup.append('circle')
          .attr('cx', pos.x)
          .attr('cy', pos.y)
          .attr('r', 11)
          .attr('fill', elementColors[meridian.elementAffinity])
          .attr('opacity', 0.25)
          .attr('filter', 'url(#qiGlow)');
      }

      // Main Acupoint Node
      nodeGroup.append('circle')
        .attr('cx', pos.x)
        .attr('cy', pos.y)
        .attr('r', meridian.unlocked ? 7 : 5)
        .attr('fill', meridian.unlocked ? elementColors[meridian.elementAffinity] : '#1e293b')
        .attr('stroke', meridian.unlocked ? '#ffffff' : '#475569')
        .attr('stroke-width', 1.5);

      // Node label
      nodeGroup.append('text')
        .attr('x', pos.x + (pos.x >= centerX ? 12 : -12))
        .attr('y', pos.y + 3)
        .attr('text-anchor', pos.x >= centerX ? 'start' : 'end')
        .attr('font-size', '10px')
        .attr('font-weight', meridian.unlocked ? '600' : '400')
        .attr('fill', meridian.unlocked ? '#f8fafc' : '#64748b')
        .text(meridian.pinyin);
    });

  }, [cultivator, cultivator.qi, cultivator.meridians, cultivator.dantianPurity]);

  const openedCount = cultivator.meridians.filter((m) => m.unlocked).length;
  const saturationPercentage = Math.floor((cultivator.qi / cultivator.maxQi) * 100);

  return (
    <div className="relative bg-stone-900/80 border border-stone-800 rounded-xl p-5 flex flex-col items-center">
      {/* Title & Legend */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-stone-800">
        <div>
          <h3 className="font-cinzel text-sm font-semibold text-stone-100 flex items-center gap-2">
            <span>Matriz del Dantian & Acupuntos D3</span>
          </h3>
          <p className="text-[11px] text-stone-400">
            Saturación del Núcleo: <strong className="text-amber-300 font-mono tabular-nums">{saturationPercentage}%</strong> · Canales: <strong className="text-emerald-400 font-mono tabular-nums">{openedCount}/8</strong>
          </p>
        </div>
        <div className="text-[10px] text-stone-400 bg-stone-950 px-2.5 py-1 rounded border border-stone-800">
          Pureza: <span className="text-cyan-400 font-bold">{cultivator.dantianPurity}%</span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full flex justify-center overflow-hidden">
        <svg
          ref={svgRef}
          viewBox="0 0 420 480"
          className="w-full max-w-[360px] h-auto select-none"
        />

        {/* Hover Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-30 pointer-events-none p-3 bg-stone-950/95 border border-amber-600/60 rounded-lg text-xs shadow-xl backdrop-blur max-w-[200px]"
            style={{
              left: Math.min(220, Math.max(10, hoveredNode.x - 60)),
              top: Math.max(10, hoveredNode.y - 80),
            }}
          >
            <div className="font-bold text-amber-200">{hoveredNode.meridian.name}</div>
            <div className="text-[10px] text-stone-400 font-mono mb-1">
              {hoveredNode.meridian.pinyin} · Afinidad {hoveredNode.meridian.elementAffinity}
            </div>
            <div className="text-[11px] text-emerald-400 mb-1">
              {hoveredNode.meridian.bonus}
            </div>
            <div className="text-[10px] text-stone-400 border-t border-stone-800 pt-1">
              Estado:{' '}
              {hoveredNode.meridian.unlocked ? (
                <span className="text-emerald-400 font-semibold">Canal Abierto</span>
              ) : (
                <span className="text-stone-500">Bloqueado ({hoveredNode.meridian.qiCost} Qi)</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="w-full pt-3 mt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-500">
        <span>Canales interactivos de Qi</span>
        <span>Haz clic en un acupunto para canalizar Qi</span>
      </div>
    </div>
  );
};
