import React from 'react';
import { Link } from 'react-router-dom';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import CustomContainer from 'src/components/CustomContainer';
import routes from 'src/components/Helpers/Routes';
import { useAppTheme } from 'src/constants/AppConfig';

const ScadaOverview = () => {
  const [theme] = useAppTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors - subtle and professional
  const colors = {
    // Background colors
    bgPrimary: isDark ? '#0e0e23' : '#f8fafc',
    bgSecondary: isDark ? '#1a1a2e' : '#ffffff',
    bgTertiary: isDark ? '#24243e' : '#f1f5f9',

    // Equipment colors
    equipmentFill: isDark ? '#1e293b' : '#e2e8f0',
    equipmentStroke: isDark ? '#475569' : '#94a3b8',
    equipmentStrokeHeavy: isDark ? '#64748b' : '#64748b',

    // Pipe colors - blue tones for process flow
    pipeStart: isDark ? '#3b82f6' : '#2563eb',
    pipeMid: isDark ? '#2563eb' : '#1d4ed8',
    pipeEnd: isDark ? '#1e40af' : '#1e3a8a',

    // Hot pipe colors - warm tones for heated streams
    pipeHotStart: isDark ? '#f59e0b' : '#f97316',
    pipeHotMid: isDark ? '#f97316' : '#ea580c',
    pipeHotEnd: isDark ? '#ea580c' : '#c2410c',

    // Pump colors
    pumpFillStart: isDark ? '#0ea5e9' : '#0284c7',
    pumpFillEnd: isDark ? '#0284c7' : '#0369a1',
    pumpStroke: isDark ? '#075985' : '#0c4a6e',
    pumpInner: isDark ? '#0c4a6e' : '#082f49',
    pumpIndicator: isDark ? '#38bdf8' : '#0ea5e9',

    // Tank colors
    tankFillStart: isDark ? '#334155' : '#cbd5e1',
    tankFillEnd: isDark ? '#1e293b' : '#94a3b8',
    tankStroke: isDark ? '#475569' : '#64748b',

    // Fluid colors - cyan tones
    fluidStart: isDark ? '#06b6d4' : '#0891b2',
    fluidEnd: isDark ? '#0891b2' : '#0e7490',

    // Valve colors - amber/yellow
    valveFill: isDark ? '#fbbf24' : '#f59e0b',
    valveStroke: isDark ? '#f59e0b' : '#d97706',
    valveHandle: isDark ? '#78716c' : '#57534e',

    // Sensor colors
    sensorActive: isDark ? '#10b981' : '#059669',
    sensorWarning: isDark ? '#f59e0b' : '#d97706',
    sensorError: isDark ? '#ef4444' : '#dc2626',
    sensorBg: isDark ? '#1f2937' : '#f9fafb',

    // Text colors
    textPrimary: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    textLabel: isDark ? '#cbd5e1' : '#475569',
    textMuted: isDark ? '#64748b' : '#94a3b8',
    textBright: isDark ? '#ffffff' : '#0f172a',

    // Temperature indicator
    tempColor: isDark ? '#f97316' : '#ea580c',

    // Grid and borders
    gridColor: isDark ? '#334155' : '#e2e8f0',
    borderColor: isDark ? '#334155' : '#cbd5e1',

    // Legend background
    legendBg: isDark ? '#1f2937' : '#ffffff',
    legendBorder: isDark ? '#374151' : '#e5e7eb',

    // Flow indicators
    flowActive: isDark ? '#60a5fa' : '#3b82f6',
    flowHot: isDark ? '#fb923c' : '#f97316',

    // Status indicators
    statusActiveBg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)',
    statusWarningBg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.1)',

    // Measurement indicators
    measurementFill: isDark ? '#1f2937' : '#f3f4f6',
    measurementStroke: isDark ? '#6b7280' : '#9ca3af',
    measurementText: isDark ? '#3b82f6' : '#2563eb',
  };

  const sensors = [
    { id: 'sensor1', x: 125, y: 185, assetId: '68075efff15d2714b98c812c', label: 'Inlet Flow & Pressure', status: 'active' },
    { id: 'sensor2', x: 305, y: 185, assetId: '680757c98cc6b9121c476ccf', label: 'Pump Discharge Pressure', status: 'active' },
    { id: 'sensor3', x: 485, y: 185, assetId: '680757c98cc6b9121c476cce', label: 'Heat Exchanger Temp', status: 'active' },
    { id: 'sensor4', x: 665, y: 110, assetId: '680757c98cc6b9121c476ccd', label: 'Separator Level & Pressure', status: 'warning' },
    { id: 'sensor5', x: 845, y: 165, assetId: '680757c98cc6b9121c476ccc', label: 'Storage Tank Level', status: 'active' },
    { id: 'sensor6', x: 845, y: 325, assetId: '680757c98cc6b9121c476ccb', label: 'Output Flow Rate', status: 'active' },
  ];

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: 'SCADA Overview' }]} />
      </div>

      <CustomContainer>
        <div style={{
          padding: '24px',
          background: colors.bgPrimary,
          borderRadius: '12px',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.08)',
          border: `1px solid ${colors.borderColor}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: colors.sensorActive,
                  boxShadow: isDark ? `0 0 8px ${colors.sensorActive}` : 'none'
                }}></div>
                <span style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: '500' }}>5 Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: colors.sensorWarning,
                  boxShadow: isDark ? `0 0 8px ${colors.sensorWarning}` : 'none'
                }}></div>
                <span style={{ color: colors.textSecondary, fontSize: '13px', fontWeight: '500' }}>1 Warning</span>
              </div>
            </div>
          </div>

          <svg
            width="100%"
            height="500"
            viewBox="0 0 1100 500"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, #1a1a2e 0%, #0e0e23 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
              borderRadius: '8px',
              border: `1px solid ${colors.borderColor}`,
            }}
          >
            <defs>
              {/* Gradients for pipes */}
              <linearGradient id="pipeActive" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={colors.pipeStart} />
                <stop offset="50%" stopColor={colors.pipeMid} />
                <stop offset="100%" stopColor={colors.pipeEnd} />
              </linearGradient>

              <linearGradient id="pipeHot" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={colors.pipeHotStart} />
                <stop offset="50%" stopColor={colors.pipeHotMid} />
                <stop offset="100%" stopColor={colors.pipeHotEnd} />
              </linearGradient>

              {/* Equipment gradients */}
              <linearGradient id="pumpGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.pumpFillStart} />
                <stop offset="100%" stopColor={colors.pumpFillEnd} />
              </linearGradient>

              <linearGradient id="tankGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.tankFillStart} />
                <stop offset="100%" stopColor={colors.tankFillEnd} />
              </linearGradient>

              <linearGradient id="fluidLevel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.fluidStart} />
                <stop offset="100%" stopColor={colors.fluidEnd} />
              </linearGradient>

              {/* Filters and effects */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={isDark ? '0.4' : '0.15'} />
              </filter>

              {/* Animated flow */}
              <linearGradient id="flowAnimation" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={colors.pipeStart}>
                  <animate attributeName="stop-color" values={`${colors.pipeStart};${colors.flowActive};${colors.pipeStart}`} dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="50%" stopColor={colors.flowActive}>
                  <animate attributeName="stop-color" values={`${colors.flowActive};${colors.pipeStart};${colors.flowActive}`} dur="2s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stopColor={colors.pipeStart}>
                  <animate attributeName="stop-color" values={`${colors.pipeStart};${colors.flowActive};${colors.pipeStart}`} dur="2s" repeatCount="indefinite" />
                </stop>
              </linearGradient>
            </defs>

            {/* Background grid */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={colors.gridColor} strokeWidth="0.5" opacity={isDark ? '0.3' : '0.2'} />
            </pattern>
            <rect width="1100" height="500" fill="url(#grid)" />

            {/* Main Process Flow Pipes */}
            {/* Inlet to Pump */}
            <path
              d="M 80 210 H 210"
              stroke="url(#pipeActive)"
              strokeWidth="8"
              fill="none"
              filter="url(#glow)"
            />
            {/* Pump to Heat Exchanger */}
            <path
              d="M 270 210 H 410"
              stroke="url(#pipeActive)"
              strokeWidth="8"
              fill="none"
              filter="url(#glow)"
            />
            {/* Heat Exchanger to Separator */}
            <path
              d="M 500 210 H 590"
              stroke="url(#pipeHot)"
              strokeWidth="8"
              fill="none"
              filter="url(#glow)"
            />
            {/* Separator to Storage Tank (top line) */}
            <path
              d="M 710 150 H 770"
              stroke="url(#pipeActive)"
              strokeWidth="7"
              fill="none"
              filter="url(#glow)"
            />
            {/* Separator to Discharge (bottom line) */}
            <path
              d="M 710 240 H 770"
              stroke="url(#pipeActive)"
              strokeWidth="7"
              fill="none"
              filter="url(#glow)"
            />
            {/* Storage to Output */}
            <path
              d="M 910 190 H 950 V 350 H 990"
              stroke="url(#pipeActive)"
              strokeWidth="7"
              fill="none"
              filter="url(#glow)"
            />
            {/* Discharge to Output */}
            <path
              d="M 910 270 H 950 V 350"
              stroke="url(#pipeActive)"
              strokeWidth="7"
              fill="none"
              filter="url(#glow)"
            />

            {/* === INLET SECTION === */}
            <g>
              {/* Inlet structure */}
              <rect
                x="35"
                y="180"
                width="45"
                height="60"
                rx="4"
                fill={colors.equipmentFill}
                stroke={colors.equipmentStroke}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              <rect
                x="42"
                y="195"
                width="31"
                height="30"
                fill="url(#fluidLevel)"
                opacity="0.6"
              />
              <text x="57" y="165" fontSize="11" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                INLET
              </text>
              <text x="57" y="258" fontSize="9" fill={colors.textMuted} textAnchor="middle">
                Feed Source
              </text>
              {/* Flow indicator */}
              <polygon points="70,210 80,210 75,205" fill={colors.flowActive} opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
              </polygon>
            </g>

            {/* === PUMP UNIT === */}
            <g>
              <circle
                cx="240"
                cy="210"
                r="28"
                fill="url(#pumpGradient)"
                stroke={colors.pumpStroke}
                strokeWidth="2.5"
                filter="url(#shadow)"
              />
              <circle cx="240" cy="210" r="18" fill="none" stroke={colors.pumpInner} strokeWidth="1.5" />
              <circle cx="240" cy="210" r="10" fill={colors.pumpInner} />
              {/* Rotation animation */}
              <line x1="240" y1="210" x2="240" y2="195" stroke={colors.pumpIndicator} strokeWidth="2.5">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 240 210"
                  to="360 240 210"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </line>
              <text x="240" y="255" fontSize="11" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                PUMP-01
              </text>
              <text x="240" y="268" fontSize="9" fill={colors.textMuted} textAnchor="middle">
                Primary
              </text>
              {/* Status indicator */}
              <circle cx="260" cy="195" r="4" fill={colors.sensorActive} filter="url(#glow)">
                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* === HEAT EXCHANGER === */}
            <g>
              <rect
                x="410"
                y="175"
                width="90"
                height="70"
                rx="6"
                fill={colors.equipmentFill}
                stroke={colors.equipmentStroke}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              {/* Heat exchanger tubes */}
              {[0, 1, 2, 3, 4].map((i) => (
                <line
                  key={i}
                  x1="420"
                  y1={185 + i * 12}
                  x2="490"
                  y2={185 + i * 12}
                  stroke={colors.textMuted}
                  strokeWidth="1.5"
                />
              ))}
              {/* Temperature indicator */}
              <rect x="425" y="230" width="60" height="8" rx="4" fill={colors.tankFillEnd} />
              <rect x="425" y="230" width="45" height="8" rx="4" fill={colors.tempColor}>
                <animate attributeName="width" values="40;50;40" dur="3s" repeatCount="indefinite" />
              </rect>
              <text x="455" y="160" fontSize="11" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                HEAT-EX-01
              </text>
              <text x="455" y="265" fontSize="9" fill={colors.tempColor} textAnchor="middle">
                ⬆ 185°C
              </text>
            </g>

            {/* === SEPARATOR VESSEL === */}
            <g>
              <ellipse
                cx="650"
                cy="195"
                rx="60"
                ry="80"
                fill={colors.equipmentFill}
                stroke={colors.equipmentStroke}
                strokeWidth="2.5"
                filter="url(#shadow)"
              />
              {/* Fluid level */}
              <ellipse
                cx="650"
                cy="225"
                rx="50"
                ry="40"
                fill="url(#fluidLevel)"
                opacity="0.5"
              />
              {/* Separation layers */}
              <line x1="600" y1="210" x2="700" y2="210" stroke={colors.tankFillEnd} strokeWidth="1.5" strokeDasharray="4,2" />
              <line x1="600" y1="230" x2="700" y2="230" stroke={colors.tankFillEnd} strokeWidth="1.5" strokeDasharray="4,2" />

              <text x="650" y="105" fontSize="11" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                SEPARATOR-01
              </text>
              <text x="650" y="290" fontSize="9" fill={colors.sensorWarning} textAnchor="middle">
                ⚠ High Level
              </text>
              {/* Pressure gauge */}
              <circle cx="680" cy="140" r="12" fill={colors.measurementFill} stroke={colors.equipmentStroke} strokeWidth="1.5" />
              <text x="680" y="144" fontSize="8" fill={colors.sensorActive} textAnchor="middle" fontWeight="600">
                PSI
              </text>
            </g>

            {/* === CONTROL VALVES === */}
            {/* Valve 1 - Top outlet */}
            <g>
              <polygon
                points="740,145 755,150 740,155 725,150"
                fill={colors.valveFill}
                stroke={colors.valveStroke}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              <rect x="743" y="135" width="4" height="10" fill={colors.valveHandle} />
              <text x="755" y="135" fontSize="8" fill={colors.textLabel} fontWeight="600">
                CV-01
              </text>
            </g>

            {/* Valve 2 - Bottom outlet */}
            <g>
              <polygon
                points="740,235 755,240 740,245 725,240"
                fill={colors.valveFill}
                stroke={colors.valveStroke}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              <rect x="743" y="225" width="4" height="10" fill={colors.valveHandle} />
              <text x="755" y="225" fontSize="8" fill={colors.textLabel} fontWeight="600">
                CV-02
              </text>
            </g>

            {/* Valve 3 - Storage outlet */}
            <g>
              <polygon
                points="925,345 935,350 925,355 915,350"
                fill={colors.valveFill}
                stroke={colors.valveStroke}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              <rect x="923" y="335" width="4" height="10" fill={colors.valveHandle} />
              <text x="935" y="335" fontSize="8" fill={colors.textLabel} fontWeight="600">
                CV-03
              </text>
            </g>

            {/* === STORAGE TANK === */}
            <g>
              <rect
                x="770"
                y="140"
                width="140"
                height="100"
                rx="8"
                fill="url(#tankGradient)"
                stroke={colors.tankStroke}
                strokeWidth="2.5"
                filter="url(#shadow)"
              />
              {/* Tank level */}
              <rect
                x="780"
                y="170"
                width="120"
                height="60"
                rx="4"
                fill="url(#fluidLevel)"
                opacity="0.6"
              />
              {/* Level indicators */}
              <line x1="905" y1="150" x2="920" y2="150" stroke={colors.textMuted} strokeWidth="1" />
              <line x1="905" y1="170" x2="920" y2="170" stroke={colors.textMuted} strokeWidth="1" />
              <line x1="905" y1="190" x2="920" y2="190" stroke={colors.textMuted} strokeWidth="1" />
              <line x1="905" y1="210" x2="920" y2="210" stroke={colors.textMuted} strokeWidth="1" />
              <line x1="905" y1="230" x2="920" y2="230" stroke={colors.textMuted} strokeWidth="1" />

              <text x="840" y="125" fontSize="11" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                STORAGE-TK-01
              </text>
              <text x="840" y="260" fontSize="9" fill={colors.sensorActive} textAnchor="middle">
                Level: 75%
              </text>

              {/* Capacity label */}
              <text x="840" y="195" fontSize="13" fill={colors.textBright} textAnchor="middle" fontWeight="700">
                5000 BBL
              </text>
            </g>

            {/* === DISCHARGE TANK === */}
            <g>
              <rect
                x="770"
                y="250"
                width="140"
                height="70"
                rx="8"
                fill="url(#tankGradient)"
                stroke={colors.tankStroke}
                strokeWidth="2.5"
                filter="url(#shadow)"
              />
              {/* Tank level */}
              <rect
                x="780"
                y="275"
                width="120"
                height="35"
                rx="4"
                fill="url(#fluidLevel)"
                opacity="0.5"
              />
              <text x="840" y="240" fontSize="10" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                DISCHARGE-01
              </text>
              <text x="840" y="340" fontSize="8" fill={colors.sensorActive} textAnchor="middle">
                Active
              </text>
            </g>

            {/* === OUTPUT SECTION === */}
            <g>
              <rect
                x="990"
                y="330"
                width="55"
                height="40"
                rx="4"
                fill={colors.equipmentFill}
                stroke={colors.equipmentStroke}
                strokeWidth="2"
                filter="url(#shadow)"
              />
              <circle cx="1017" cy="350" r="8" fill={colors.sensorActive} opacity="0.3" />
              <text x="1017" y="320" fontSize="10" fill={colors.textLabel} fontWeight="600" textAnchor="middle">
                OUTPUT
              </text>
              <text x="1017" y="385" fontSize="8" fill={colors.textMuted} textAnchor="middle">
                To Pipeline
              </text>
              {/* Flow indicator */}
              <polygon points="990,350 980,350 985,345" fill={colors.sensorActive} opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
              </polygon>
            </g>

            {/* === FLOW DIRECTION ARROWS === */}
            <defs>
              <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
              </marker>
              <marker id="arrowRed" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                <polygon points="0 0, 10 3, 0 6" fill="#ef4444" />
              </marker>
            </defs>

            {/* Flow arrows with animation */}
            <g opacity="0.9">
              <circle cx="145" cy="210" r="3" fill={colors.flowActive}>
                <animate attributeName="cx" values="145;190;145" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="340" cy="210" r="3" fill={colors.flowActive}>
                <animate attributeName="cx" values="340;390;340" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="540" cy="210" r="3" fill={colors.flowHot}>
                <animate attributeName="cx" values="540;580;540" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="770" cy="150" r="2.5" fill={colors.flowActive}>
                <animate attributeName="cx" values="740;760;740" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="770" cy="240" r="2.5" fill={colors.flowActive}>
                <animate attributeName="cx" values="740;760;740" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* === SENSOR MARKERS (6 sensors with clickable links) === */}
            {sensors.map(sensor => {
              const statusColor = sensor.status === 'active' ? colors.sensorActive :
                sensor.status === 'warning' ? colors.sensorWarning : colors.sensorError;
              const statusGlow = sensor.status === 'active' ? `0 0 10px ${colors.sensorActive}` :
                sensor.status === 'warning' ? `0 0 10px ${colors.sensorWarning}` : `0 0 10px ${colors.sensorError}`;

              return (
                <Link
                  key={sensor.id}
                  to={`${routes.serializedAssetDetail.path}/${sensor.assetId}`}
                  target="_blank"
                >
                  <g style={{ cursor: 'pointer' }}>
                    {/* Sensor pulse ring */}
                    <circle
                      cx={sensor.x}
                      cy={sensor.y}
                      r="18"
                      fill="none"
                      stroke={statusColor}
                      strokeWidth="1.5"
                      opacity="0.3"
                    >
                      <animate
                        attributeName="r"
                        values="18;24;18"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.3;0;0.3"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Sensor body */}
                    <circle
                      cx={sensor.x}
                      cy={sensor.y}
                      r="14"
                      fill={colors.sensorBg}
                      stroke={statusColor}
                      strokeWidth="2.5"
                      filter="url(#shadow)"
                      style={{
                        boxShadow: statusGlow,
                      }}
                    />

                    {/* Sensor icon */}
                    <circle
                      cx={sensor.x}
                      cy={sensor.y}
                      r="6"
                      fill={statusColor}
                      opacity="0.8"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.6;1;0.6"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Sensor ID label */}
                    <text
                      x={sensor.x}
                      y={sensor.y - 24}
                      fontSize="10"
                      fontWeight="700"
                      fill={colors.textBright}
                      textAnchor="middle"
                    >
                      {sensor.id.toUpperCase()}
                    </text>

                    {/* Tooltip */}
                    <title>{sensor.label} - Click to view details</title>
                  </g>
                </Link>
              );
            })}

            {/* === ADDITIONAL INSTRUMENTATION === */}
            {/* Flow meters */}
            <g>
              <circle cx="145" cy="195" r="8" fill={colors.measurementFill} stroke={colors.measurementStroke} strokeWidth="1.5" />
              <text x="145" y="198" fontSize="6" fill={colors.measurementText} textAnchor="middle" fontWeight="600">FM</text>
            </g>
            <g>
              <circle cx="340" cy="195" r="8" fill={colors.measurementFill} stroke={colors.measurementStroke} strokeWidth="1.5" />
              <text x="340" y="198" fontSize="6" fill={colors.measurementText} textAnchor="middle" fontWeight="600">FM</text>
            </g>

            {/* Legend */}
            <g>
              <rect x="20" y="20" width="200" height="85" rx="6" fill={colors.legendBg} fillOpacity="0.95" stroke={colors.legendBorder} strokeWidth="1.5" />
              <text x="30" y="38" fontSize="11" fill={colors.textBright} fontWeight="600">System Legend</text>

              <line x1="30" y1="50" x2="55" y2="50" stroke={colors.pipeStart} strokeWidth="4" />
              <text x="62" y="54" fontSize="9" fill={colors.textSecondary}>Process Flow</text>

              <line x1="30" y1="65" x2="55" y2="65" stroke={colors.pipeHotStart} strokeWidth="4" />
              <text x="62" y="69" fontSize="9" fill={colors.textSecondary}>Hot Stream</text>

              <circle cx="42" cy="80" r="5" fill={colors.sensorActive} />
              <text x="62" y="84" fontSize="9" fill={colors.textSecondary}>Active Sensor</text>

              <circle cx="42" cy="95" r="5" fill={colors.sensorWarning} />
              <text x="62" y="99" fontSize="9" fill={colors.textSecondary}>Warning</text>
            </g>

            {/* Real-time status indicators */}
            <g>
              <rect x="880" y="20" width="200" height="60" rx="6" fill={colors.legendBg} fillOpacity="0.95" stroke={colors.legendBorder} strokeWidth="1.5" />
              <text x="890" y="38" fontSize="11" fill={colors.textBright} fontWeight="600">System Status</text>
              <text x="890" y="54" fontSize="9" fill={colors.sensorActive}>● Flow Rate: 2,450 BPD</text>
              <text x="890" y="68" fontSize="9" fill={colors.sensorActive}>● Pressure: 1,250 PSI</text>
            </g>
          </svg>
        </div>
      </CustomContainer>
    </section>
  );
};

export default ScadaOverview;