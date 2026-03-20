import React, { useMemo, useState } from "react";
import {
    Activity,
    Archive,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Database,
    Dna,
    Download,
    FileText,
    FlaskConical,
    GraduationCap,
    Layers3,
    ListFilter,
    Lock,
    LogIn,
    Mail,
    Printer,
    Search,
    ShieldCheck,
    Sparkles,
    UserCircle2,
} from "lucide-react";

type RiskLevel = "High" | "Medium" | "Low" | "Borderline";
type SampleStatus = "分析中" | "已分析" | "待复核" | "已归档";
type PageId = "login" | "home" | "samples" | "principle" | "detect" | "result" | "followup" | "about";
type SortKey = "receivedAt" | "risk" | "status" | "eclScore";

type SampleRow = {
    id: string;
    accessionNo: string;
    patient: string;
    sampleType: string;
    groupName: string;
    status: SampleStatus;
    risk: RiskLevel;
    owner: string;
    receivedAt: string;
    sex: string;
    age: string;
    purpose: string;
    template: string;
    mir21: number;
    mir155: number;
    mir10b: number;
    threshold: number;
    eclScore: number;
    amplificationTotal: number;
    resultName: string;
    resultText: string;
    explanation: string;
    suggestion: string;
    inputSignature: string;
    createdAt: string;
    updatedAt: string;
    version: number;
};

type FormState = {
    sampleId: string;
    accessionNo: string;
    patientName: string;
    sex: string;
    age: string;
    groupName: string;
    sampleType: string;
    purpose: string;
    owner: string;
    receivedAt: string;
    mir21: number;
    mir155: number;
    mir10b: number;
    threshold: number;
    template: string;
};

type LoginState = {
    email: string;
    password: string;
};

type NewSampleState = {
    patientName: string;
    sex: string;
    age: string;
    groupName: string;
    sampleType: string;
    purpose: string;
    owner: string;
};

type LogicRule = {
    id: string;
    name: string;
    result: string;
    level: RiskLevel;
    explanation: string;
    suggestion: string;
    condition: (m21: boolean, m155: boolean, m10b: boolean) => boolean;
};

type NavItem = {
    id: PageId;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
    { id: "login", label: "访问入口", icon: LogIn },
    { id: "home", label: "总览面板", icon: Activity },
    { id: "samples", label: "样本中心", icon: ListFilter },
    { id: "principle", label: "机理说明", icon: FlaskConical },
    { id: "detect", label: "分析任务", icon: ShieldCheck },
    { id: "result", label: "结果中心", icon: FileText },
    { id: "followup", label: "处置建议", icon: ClipboardList },
    { id: "about", label: "平台信息", icon: Database },
];

const SAMPLE_TABS = ["全部", "分析中", "已分析", "待复核", "已归档"] as const;
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "receivedAt", label: "按记录时间排序" },
    { key: "risk", label: "按结果等级排序" },
    { key: "status", label: "按状态排序" },
    { key: "eclScore", label: "按 ECL 强度排序" },
];
const SAMPLES_PER_PAGE = 4;

const LOGIC_RULES: LogicRule[] = [
    {
        id: "rule-1",
        name: "早筛模式 A",
        result: "高等级规则命中",
        level: "High",
        explanation: "miR-21 与 miR-155 同时阳性，且 miR-10b 未显著升高，触发联合判定。",
        suggestion: "建议优先进行人工复核，并结合原始信号、实验条件和其他指标综合分析。",
        condition: (m21, m155, m10b) => m21 && m155 && !m10b,
    },
    {
        id: "rule-2",
        name: "转移预警模式 B",
        result: "中等级规则预警",
        level: "Medium",
        explanation: "miR-10b 升高并伴随至少一个目标 miRNA 阳性，提示中等级预警。",
        suggestion: "建议补充分析，并根据需要安排复测或调整参数。",
        condition: (m21, m155, m10b) => m10b && (m21 || m155),
    },
    {
        id: "rule-3",
        name: "低等级模式 C",
        result: "未见明显异常组合",
        level: "Low",
        explanation: "核心输入均未达到设定阈值，当前未触发高等级逻辑链路。",
        suggestion: "建议常规记录与汇总，必要时进行补充复测。",
        condition: (m21, m155, m10b) => !m21 && !m155 && !m10b,
    },
];

const INITIAL_SAMPLES: SampleRow[] = [
    {
        id: "P-2026-001",
        accessionNo: "ACC-20260310-01",
        patient: "ZHANG *",
        sampleType: "血清",
        groupName: "课题A组",
        status: "已分析",
        risk: "High",
        owner: "项目成员A",
        receivedAt: "2026-03-10 08:40",
        sex: "A组",
        age: "47",
        purpose: "乳腺癌 miRNA 规则验证",
        template: "乳腺癌早筛模板",
        mir21: 0.82,
        mir155: 0.76,
        mir10b: 0.18,
        threshold: 0.6,
        eclScore: 61,
        amplificationTotal: 59,
        resultName: "早筛模式 A",
        resultText: "高等级规则命中",
        explanation: "miR-21 与 miR-155 同时阳性，且 miR-10b 未显著升高，触发联合判定。",
        suggestion: "建议优先进行人工复核，并结合原始信号、实验条件和其他指标综合分析。",
        inputSignature: "1 / 1 / 0",
        createdAt: "2026-03-10 08:40",
        updatedAt: "2026-03-10 08:58",
        version: 2,
    },
    {
        id: "P-2026-014",
        accessionNo: "ACC-20260310-02",
        patient: "LI *",
        sampleType: "血浆",
        groupName: "课题B组",
        status: "已分析",
        risk: "Medium",
        owner: "项目成员B",
        receivedAt: "2026-03-10 09:15",
        sex: "B组",
        age: "38",
        purpose: "转移相关 miRNA 变化分析",
        template: "转移风险评估模板",
        mir21: 0.66,
        mir155: 0.31,
        mir10b: 0.72,
        threshold: 0.6,
        eclScore: 56,
        amplificationTotal: 57,
        resultName: "转移预警模式 B",
        resultText: "中等级规则预警",
        explanation: "miR-10b 升高并伴随至少一个目标 miRNA 阳性，提示中等级预警。",
        suggestion: "建议补充分析，并根据需要安排复测或调整参数。",
        inputSignature: "1 / 0 / 1",
        createdAt: "2026-03-10 09:15",
        updatedAt: "2026-03-10 09:29",
        version: 2,
    },
    {
        id: "P-2026-021",
        accessionNo: "ACC-20260310-03",
        patient: "WANG *",
        sampleType: "组织",
        groupName: "课题C组",
        status: "待复核",
        risk: "Borderline",
        owner: "项目成员C",
        receivedAt: "2026-03-10 10:05",
        sex: "A组",
        age: "52",
        purpose: "边界样本阈值验证",
        template: "多标志物联合识别模板",
        mir21: 0.58,
        mir155: 0.61,
        mir10b: 0.59,
        threshold: 0.6,
        eclScore: 59,
        amplificationTotal: 59,
        resultName: "边界模式",
        resultText: "需进一步复核",
        explanation: "当前输入信号处于阈值附近，建议补充实验或重复检测。",
        suggestion: "建议复核前处理质量、阈值设置，并结合更多实验信息判断。",
        inputSignature: "0 / 1 / 0",
        createdAt: "2026-03-10 10:05",
        updatedAt: "2026-03-10 10:18",
        version: 3,
    },
    {
        id: "P-2026-027",
        accessionNo: "ACC-20260310-04",
        patient: "CHEN *",
        sampleType: "体液",
        groupName: "课题D组",
        status: "已归档",
        risk: "Low",
        owner: "项目成员D",
        receivedAt: "2026-03-10 11:20",
        sex: "B组",
        age: "41",
        purpose: "基础阴性对照样本汇总",
        template: "乳腺癌早筛模板",
        mir21: 0.21,
        mir155: 0.18,
        mir10b: 0.24,
        threshold: 0.6,
        eclScore: 23,
        amplificationTotal: 31,
        resultName: "低等级模式 C",
        resultText: "未见明显异常组合",
        explanation: "核心输入均未达到设定阈值，当前未触发高等级逻辑链路。",
        suggestion: "建议常规记录与汇总，必要时进行补充复测。",
        inputSignature: "0 / 0 / 0",
        createdAt: "2026-03-10 11:20",
        updatedAt: "2026-03-10 11:36",
        version: 1,
    },
];

const riskLabel: Record<RiskLevel, string> = {
    High: "高等级",
    Medium: "中等级",
    Low: "低等级",
    Borderline: "待复核",
};

const badgeStyle: Record<RiskLevel, string> = {
    High: "bg-teal-50 text-teal-700 border-teal-200",
    Medium: "bg-cyan-50 text-cyan-700 border-cyan-200",
    Low: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Borderline: "bg-sky-50 text-sky-700 border-sky-200",
};

const riskColor: Record<RiskLevel, string> = {
    High: "text-teal-700",
    Medium: "text-cyan-700",
    Low: "text-emerald-600",
    Borderline: "text-sky-700",
};

const statusStyle: Record<SampleStatus, string> = {
    分析中: "bg-amber-50 text-amber-700 border-amber-200",
    已分析: "bg-teal-50 text-teal-700 border-teal-200",
    待复核: "bg-sky-50 text-sky-700 border-sky-200",
    已归档: "bg-slate-50 text-slate-600 border-slate-200",
};

const cardClass = "rounded-[24px] border border-teal-100 bg-white p-6 shadow-sm";
const softCardClass = "rounded-[20px] border border-teal-100 bg-teal-50/60 p-5";
const inputClass = "w-full rounded-2xl border border-teal-100 bg-white px-4 py-3 text-sm outline-none focus:border-teal-300";
const labelClass = "mb-2 block text-sm font-medium text-slate-600";

function SectionTitle(props: { eyebrow: string; title: string; desc: string }) {
    return (
        <div className="max-w-3xl">
            <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">{props.eyebrow}</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{props.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{props.desc}</p>
        </div>
    );
}

function TopStat(props: {
    title: string;
    value: string;
    meta: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
    const Icon = props.icon;
    return (
        <div className="rounded-[20px] border border-teal-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">{props.title}</div>
                <div className="rounded-2xl bg-teal-50 p-2 text-teal-700">
                    <Icon size={18} />
                </div>
            </div>
            <div className="mt-4 text-3xl font-bold text-slate-900">{props.value}</div>
            <div className="mt-2 text-sm text-slate-500">{props.meta}</div>
        </div>
    );
}

function RiskBadge(props: { level: RiskLevel }) {
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle[props.level]}`}>
      {riskLabel[props.level]}
    </span>
    );
}

function StatusBadge(props: { status: SampleStatus }) {
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[props.status]}`}>
      {props.status}
    </span>
    );
}

function InfoField(props: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-teal-100 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">{props.label}</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{props.value}</div>
        </div>
    );
}

function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toTimestamp() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function buildDraftFromForm(
    form: FormState,
    rule: LogicRule,
    eclScore: number,
    amplificationTotal: number,
    signature: string,
    previous?: SampleRow
): SampleRow {
    return {
        id: form.sampleId,
        accessionNo: form.accessionNo,
        patient: form.patientName.trim() || "未命名样本",
        sampleType: form.sampleType,
        groupName: form.groupName,
        status: "分析中",
        risk: rule.level,
        owner: form.owner.trim() || "待填写",
        receivedAt: form.receivedAt.trim() || "待补充",
        sex: form.sex,
        age: form.age,
        purpose: form.purpose,
        template: form.template,
        mir21: form.mir21,
        mir155: form.mir155,
        mir10b: form.mir10b,
        threshold: form.threshold,
        eclScore,
        amplificationTotal,
        resultName: rule.name,
        resultText: rule.result,
        explanation: rule.explanation,
        suggestion: rule.suggestion,
        inputSignature: signature,
        createdAt: previous?.createdAt || form.receivedAt,
        updatedAt: toTimestamp(),
        version: (previous?.version || 0) + 1,
    };
}

export default function DocLecsDiagnosisDemo() {
    const [activePage, setActivePage] = useState<PageId>("login");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginForm, setLoginForm] = useState<LoginState>({ email: "admin@njupt.edu.cn", password: "" });
    const [globalSearch, setGlobalSearch] = useState("");
    const [loginError, setLoginError] = useState("");
    const [analysisError, setAnalysisError] = useState("");
    const [toastMessage, setToastMessage] = useState("");
    const [sampleFilter, setSampleFilter] = useState<(typeof SAMPLE_TABS)[number]>("全部");
    const [samplePage, setSamplePage] = useState(1);
    const [sampleQuery, setSampleQuery] = useState("");
    const [samples, setSamples] = useState<SampleRow[]>(INITIAL_SAMPLES);
    const [sortKey, setSortKey] = useState<SortKey>("receivedAt");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createError, setCreateError] = useState("");
    const [newSample, setNewSample] = useState<NewSampleState>({
        patientName: "",
        sex: "A组",
        age: "",
        groupName: "课题A组",
        sampleType: "血清",
        purpose: "",
        owner: "",
    });
    const [form, setForm] = useState<FormState>({
        sampleId: "P-2026-001",
        accessionNo: "ACC-20260310-01",
        patientName: "ZHANG *",
        sex: "A组",
        age: "47",
        groupName: "课题A组",
        sampleType: "血清",
        purpose: "乳腺癌 miRNA 规则验证",
        owner: "项目成员A",
        receivedAt: "2026-03-10 08:40",
        mir21: 0.82,
        mir155: 0.76,
        mir10b: 0.18,
        threshold: 0.6,
        template: "乳腺癌早筛模板",
    });

    const inputState = useMemo(
        () => ({
            m21: form.mir21 >= form.threshold,
            m155: form.mir155 >= form.threshold,
            m10b: form.mir10b >= form.threshold,
        }),
        [form.mir21, form.mir155, form.mir10b, form.threshold]
    );

    const matchedRule: LogicRule = useMemo(() => {
        const hit = LOGIC_RULES.find((rule) => rule.condition(inputState.m21, inputState.m155, inputState.m10b));
        if (hit) return hit;
        return {
            id: "fallback",
            name: "边界模式",
            result: "需进一步复核",
            level: "Borderline",
            explanation: "当前输入信号处于阈值附近，建议补充实验或重复检测。",
            suggestion: "建议复核前处理质量、阈值设置，并结合更多实验信息判断。",
            condition: () => true,
        };
    }, [inputState]);

    const eclScore = useMemo(() => {
        const raw = form.mir21 * 38 + form.mir155 * 34 + form.mir10b * 28;
        return Math.min(100, Math.round(raw));
    }, [form.mir21, form.mir155, form.mir10b]);

    const amplification = useMemo(() => {
        const stage1 = Math.round((form.mir21 + form.mir155) * 50);
        const stage2 = Math.round((form.mir10b + form.threshold) * 40);
        return {
            stage1: Math.min(stage1, 100),
            stage2: Math.min(stage2, 100),
            total: Math.min(100, Math.round((stage1 + stage2) / 2)),
        };
    }, [form.mir21, form.mir155, form.mir10b, form.threshold]);

    const currentSample = useMemo(() => samples.find((item) => item.id === form.sampleId), [samples, form.sampleId]);
    const currentSignature = `${inputState.m21 ? 1 : 0} / ${inputState.m155 ? 1 : 0} / ${inputState.m10b ? 1 : 0}`;

    const filteredSamples = useMemo(() => {
        const query = sampleQuery.trim().toLowerCase();
        const filtered = samples.filter((item) => {
            const matchesFilter = sampleFilter === "全部" || item.status === sampleFilter;
            const matchesQuery =
                query.length === 0
                    ? true
                    : [
                        item.id,
                        item.accessionNo,
                        item.patient,
                        item.sampleType,
                        item.groupName,
                        item.status,
                        item.risk,
                        item.owner,
                        item.receivedAt,
                        item.purpose,
                        item.template,
                    ]
                        .join(" ")
                        .toLowerCase()
                        .includes(query);
            return matchesFilter && matchesQuery;
        });

        const riskWeight: Record<RiskLevel, number> = { High: 4, Borderline: 3, Medium: 2, Low: 1 };
        const statusWeight: Record<SampleStatus, number> = { 分析中: 4, 待复核: 3, 已分析: 2, 已归档: 1 };

        return [...filtered].sort((a, b) => {
            if (sortKey === "eclScore") return b.eclScore - a.eclScore;
            if (sortKey === "risk") return riskWeight[b.risk] - riskWeight[a.risk];
            if (sortKey === "status") return statusWeight[b.status] - statusWeight[a.status];
            return b.receivedAt.localeCompare(a.receivedAt);
        });
    }, [samples, sampleFilter, sampleQuery, sortKey]);

    const totalSamplePages = Math.max(1, Math.ceil(filteredSamples.length / SAMPLES_PER_PAGE));
    const currentPage = Math.min(samplePage, totalSamplePages);
    const paginatedSamples = useMemo(
        () => filteredSamples.slice((currentPage - 1) * SAMPLES_PER_PAGE, currentPage * SAMPLES_PER_PAGE),
        [filteredSamples, currentPage]
    );
    const dashboardSamples = filteredSamples.slice(0, 4);
    const analyzingCount = useMemo(() => samples.filter((item) => item.status === "分析中").length, [samples]);
    const analyzedCount = useMemo(() => samples.filter((item) => item.status === "已分析").length, [samples]);
    const reviewCount = useMemo(() => samples.filter((item) => item.status === "待复核").length, [samples]);
    const archivedCount = useMemo(() => samples.filter((item) => item.status === "已归档").length, [samples]);
    const highRiskCount = useMemo(() => samples.filter((item) => item.risk === "High").length, [samples]);

    const formatMetric = (value: number, base = 0) => String(base + value);

    const goToPage = (page: PageId) => {
        if (!isAuthenticated && page !== "login") {
            setActivePage("login");
            setToastMessage("请先登录后再访问系统功能");
            return;
        }
        setActivePage(page);
    };

    const handleLogin = () => {
        if (!isValidEmail(loginForm.email.trim())) {
            setLoginError("请输入有效邮箱账号");
            return;
        }
        if (loginForm.password.trim().length < 6) {
            setLoginError("密码长度不少于 6 位");
            return;
        }
        setLoginError("");
        setIsAuthenticated(true);
        setActivePage("home");
        setToastMessage("登录成功，已进入项目工作台");
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setActivePage("login");
        setGlobalSearch("");
        setSampleQuery("");
        setSampleFilter("全部");
        setSamplePage(1);
        setToastMessage("已退出登录");
    };

    const handleGlobalSearch = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再使用搜索功能");
            return;
        }
        setSampleQuery(globalSearch.trim());
        setSampleFilter("全部");
        setSamplePage(1);
        setActivePage("samples");
    };

    const resetNewSample = () => {
        setNewSample({
            patientName: "",
            sex: "A组",
            age: "",
            groupName: "课题A组",
            sampleType: "血清",
            purpose: "",
            owner: "",
        });
        setCreateError("");
    };

    const handleOpenCreateModal = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再新建样本");
            return;
        }
        resetNewSample();
        setIsCreateModalOpen(true);
    };

    const handleCreateSample = () => {
        if (!newSample.patientName.trim()) {
            setCreateError("请填写样本名称");
            return;
        }
        if (!newSample.owner.trim()) {
            setCreateError("请填写项目成员");
            return;
        }
        if (!newSample.purpose.trim()) {
            setCreateError("请填写项目说明 / 分析目的");
            return;
        }

        const timestamp = toTimestamp();
        const nextId = `P-2026-${String(samples.length + 1).padStart(3, "0")}`;
        const nextAccession = `ACC-20260310-${String(samples.length + 1).padStart(2, "0")}`;
        const draftRow: SampleRow = {
            id: nextId,
            accessionNo: nextAccession,
            patient: newSample.patientName.trim(),
            sampleType: newSample.sampleType,
            groupName: newSample.groupName,
            status: "分析中",
            risk: "Borderline",
            owner: newSample.owner.trim(),
            receivedAt: timestamp,
            sex: newSample.sex,
            age: newSample.age,
            purpose: newSample.purpose.trim(),
            template: "乳腺癌早筛模板",
            mir21: 0.5,
            mir155: 0.5,
            mir10b: 0.5,
            threshold: 0.6,
            eclScore: 50,
            amplificationTotal: 50,
            resultName: "初始草稿",
            resultText: "待进一步分析",
            explanation: "当前为新建样本，尚未完成规则分析。",
            suggestion: "请补充参数并进入检测分析模块完成计算。",
            inputSignature: "0 / 0 / 0",
            createdAt: timestamp,
            updatedAt: timestamp,
            version: 1,
        };

        setSamples((prev) => [draftRow, ...prev]);
        setForm({
            sampleId: draftRow.id,
            accessionNo: draftRow.accessionNo,
            patientName: draftRow.patient,
            sex: draftRow.sex,
            age: draftRow.age,
            groupName: draftRow.groupName,
            sampleType: draftRow.sampleType,
            purpose: draftRow.purpose,
            owner: draftRow.owner,
            receivedAt: draftRow.receivedAt,
            mir21: draftRow.mir21,
            mir155: draftRow.mir155,
            mir10b: draftRow.mir10b,
            threshold: draftRow.threshold,
            template: draftRow.template,
        });
        setIsCreateModalOpen(false);
        setActivePage("detect");
        setToastMessage(`已新建样本 ${draftRow.accessionNo}，可继续完成检测分析`);
    };

    const handleImportSamples = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再使用导入功能");
            return;
        }
        setToastMessage("当前为演示版，导入功能预留为文件上传接口");
    };

    const handleExportList = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再导出列表");
            return;
        }
        setToastMessage(`已筛选出 ${filteredSamples.length} 条样本记录，可用于导出列表`);
    };

    const handleCreateDetect = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再创建分析任务");
            return;
        }
        const timestamp = toTimestamp();
        const nextId = `P-2026-${String(samples.length + 1).padStart(3, "0")}`;
        const nextAccession = `ACC-20260310-${String(samples.length + 1).padStart(2, "0")}`;
        setForm({
            sampleId: nextId,
            accessionNo: nextAccession,
            patientName: "",
            sex: "A组",
            age: "",
            groupName: "课题A组",
            sampleType: "血清",
            purpose: "",
            owner: "",
            receivedAt: timestamp,
            mir21: 0.5,
            mir155: 0.5,
            mir10b: 0.5,
            threshold: 0.6,
            template: "乳腺癌早筛模板",
        });
        setAnalysisError("");
        setActivePage("detect");
        setToastMessage("已创建新分析任务，请补充样本信息并生成结果报告");
    };

    const handleSaveDraft = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再保存草稿");
            return;
        }
        const draftRow = buildDraftFromForm(form, matchedRule, eclScore, amplification.total, currentSignature, currentSample);
        setSamples((prev) => {
            const exists = prev.some((item) => item.id === draftRow.id);
            return exists ? prev.map((item) => (item.id === draftRow.id ? draftRow : item)) : [draftRow, ...prev];
        });
        setToastMessage(`已保存 ${form.accessionNo} 的分析草稿`);
        setActivePage("samples");
    };

    const handleSaveAnalysis = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再生成结果");
            return;
        }
        if (!form.patientName.trim()) {
            setAnalysisError("请填写样本名称");
            return;
        }
        if (!form.owner.trim()) {
            setAnalysisError("请填写项目成员");
            return;
        }
        if (!form.purpose.trim()) {
            setAnalysisError("请填写项目说明 / 分析目的");
            return;
        }
        setAnalysisError("");

        const nextRow = buildDraftFromForm(form, matchedRule, eclScore, amplification.total, currentSignature, currentSample);
        nextRow.status = matchedRule.level === "Borderline" ? "待复核" : "已分析";
        nextRow.patient = form.patientName.trim();
        nextRow.owner = form.owner.trim();
        nextRow.purpose = form.purpose.trim();

        setSamples((prev) => {
            const exists = prev.some((item) => item.id === nextRow.id);
            return exists ? prev.map((item) => (item.id === nextRow.id ? nextRow : item)) : [nextRow, ...prev];
        });
        setToastMessage(`已保存 ${form.accessionNo} 的分析结果，并生成结果报告`);
        setActivePage("result");
    };

    const loadSampleToForm = (row: SampleRow) => {
        setForm({
            sampleId: row.id,
            accessionNo: row.accessionNo,
            patientName: row.patient,
            sex: row.sex,
            age: row.age,
            groupName: row.groupName,
            sampleType: row.sampleType,
            purpose: row.purpose,
            owner: row.owner,
            receivedAt: row.receivedAt,
            mir21: row.mir21,
            mir155: row.mir155,
            mir10b: row.mir10b,
            threshold: row.threshold,
            template: row.template,
        });
    };

    const handleViewReport = (row: SampleRow) => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再查看结果");
            return;
        }
        loadSampleToForm(row);
        setAnalysisError("");
        setActivePage("result");
    };

    const handleContinueAnalysis = (row: SampleRow) => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再编辑样本");
            return;
        }
        loadSampleToForm(row);
        setAnalysisError("");
        setActivePage("detect");
    };

    const handleArchiveCurrent = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再归档结果");
            return;
        }
        setSamples((prev) => prev.map((item) => (item.id === form.sampleId ? { ...item, status: "已归档", updatedAt: toTimestamp() } : item)));
        setToastMessage(`结果 ${form.accessionNo} 已归档`);
    };

    const handleViewSampleFromHome = (row: SampleRow) => {
        setSampleQuery(row.accessionNo);
        setSampleFilter("全部");
        setSamplePage(1);
        handleViewReport(row);
    };

    const handleExportReport = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再导出结果");
            return;
        }
        setToastMessage(`结果 ${form.accessionNo} 已准备导出（演示版未接入真实导出）`);
    };

    const handlePrintReport = () => {
        if (!isAuthenticated) {
            setActivePage("login");
            setToastMessage("请先登录后再打印结果");
            return;
        }
        window.print();
    };

    const loginPage = (
        <div className="grid min-h-[calc(100vh-170px)] gap-6 lg:grid-cols-2">
            <div className="flex items-center">
                <div className="w-full rounded-[36px] bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-400 p-8 text-white shadow-lg lg:p-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs tracking-[0.12em] text-teal-50">
                            <GraduationCap size={14} /> 项目入口
                        </div>
                    </div>
                    <div className="mt-10">
                        <div className="flex items-start gap-5 rounded-[28px] border border-white/15 bg-white/10 p-6 backdrop-blur">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-white text-teal-700 shadow-lg">
                                <Dna size={34} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold tracking-[0.18em] text-teal-50/90">Cancer miRNA Intelligence Platform</div>
                                <div className="mt-2 text-xs uppercase tracking-[0.28em] text-teal-50/80">ZHEGUANG INTELLIGENCE</div>
                                <h1 className="mt-3 text-5xl font-bold leading-tight lg:text-6xl">折光智诊-一种基于动态可编程DNA分子决策网络的肿瘤诊断方法及系统</h1>
                                <p className="mt-4 max-w-3xl text-base leading-8 text-teal-50/95 lg:text-lg">基于 DNA 折纸与逻辑电化学发光的癌症 miRNA 智能诊断平台</p>
                                <div className="mt-3 text-sm leading-7 text-teal-50/85 lg:text-base">DNA Origami &amp; Logic ECL miRNA Platform</div>
                                <div className="mt-6 flex flex-wrap gap-3 text-sm text-teal-50/95">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                                        <Sparkles size={14} /> 智能规则判读
                                    </div>
                                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                                        <Layers3 size={14} /> 双级联信号分析
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-5 max-w-xl text-sm leading-8 text-teal-50/95 lg:text-base">面向癌症 miRNA 智能分析场景，围绕样本接收、分析执行、规则判读、结果生成、版本留痕与归档管理构建统一流程，强调平台化管理能力与结构化输出能力。</p>
                    <div className="mt-8 grid gap-4 sm:grid-cols-4">
                        {[
                            ["系统状态", "运行中"],
                            ["分析中", formatMetric(analyzingCount, 286)],
                            ["待复核", formatMetric(reviewCount, 143)],
                            ["已分析", formatMetric(analyzedCount, 628)],
                        ].map(([k, v]) => (
                            <div key={k} className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                                <div className="text-sm text-teal-50/90">{k}</div>
                                <div className="mt-2 text-xl font-bold">{v}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center">
                <div className="w-full rounded-[32px] border border-teal-100 bg-white p-8 shadow-sm lg:p-10">
                    <div className="mb-6 flex items-center gap-4 rounded-[24px] border border-teal-100 bg-teal-50/60 p-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
                            <Dna size={28} />
                        </div>
                        <div>
                            <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">平台标识</div>
                            <div className="mt-1 text-xl font-bold text-slate-900">折光智诊-一种基于动态可编程DNA分子决策网络的肿瘤诊断方法及系统</div>
                            <div className="mt-1 text-sm text-slate-500">基于DNA折纸与逻辑电化学发光的癌症miRNA智能诊断平台</div>
                            <div className="mt-1 text-xs tracking-[0.08em] text-teal-700/80">Cancer miRNA Analysis Platform</div>
                        </div>
                    </div>
                    <div className="text-xs font-semibold tracking-[0.12em] text-slate-400">访问控制</div>
                    <h2 className="mt-3 text-3xl font-bold text-slate-900">平台登录</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">请输入账号信息以访问平台核心模块、分析任务与结果中心。</p>
                    <div className="mt-8 space-y-5">
                        <div>
                            <label className={labelClass}>邮箱账号</label>
                            <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3">
                                <Mail size={18} className="text-slate-400" />
                                <input
                                    className="w-full border-0 p-0 text-sm outline-none"
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                                    placeholder="请输入邮箱账号"
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>登录密码</label>
                            <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-3">
                                <Lock size={18} className="text-slate-400" />
                                <input
                                    className="w-full border-0 p-0 text-sm outline-none"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder="请输入登录密码"
                                    type="password"
                                />
                            </div>
                        </div>
                        <button onClick={handleLogin} className="w-full rounded-2xl bg-teal-600 px-5 py-3.5 text-sm font-semibold text-white">
                            进入系统
                        </button>
                        {loginError && <div className="text-sm font-medium text-rose-500">{loginError}</div>}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">访问角色</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">平台用户</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">运行模式</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">标准业务模式</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const homePage = (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-teal-500 via-cyan-400 to-emerald-400 p-8 text-white shadow-lg lg:p-10">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-teal-100/60 bg-white/10 px-4 py-2 text-xs tracking-[0.2em] text-teal-50">
                            <FlaskConical size={14} /> 平台总览
                        </div>
                        <h1 className="mt-5 text-4xl font-bold leading-tight lg:text-6xl">癌症 miRNA 智能分析总览面板</h1>
                        <p className="mt-5 max-w-2xl text-sm leading-8 text-teal-50/95 lg:text-base">平台以样本受理、分析执行、规则判读、结果生成与数据归档为主线，支持癌症 miRNA 相关分析任务的统一管理、过程追踪与结果输出。</p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <button onClick={handleCreateDetect} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-teal-700">
                                新建分析任务
                            </button>
                            <button onClick={() => goToPage("result")} className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white">
                                进入结果中心
                            </button>
                        </div>
                    </div>
                    <div className="grid w-full max-w-xl grid-cols-2 gap-4">
                        <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <div className="text-sm text-teal-50/90">当前模板</div>
                            <div className="mt-2 text-xl font-bold">{form.template}</div>
                        </div>
                        <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <div className="text-sm text-teal-50/90">运行状态</div>
                            <div className="mt-2 text-xl font-bold">正常运行</div>
                        </div>
                        <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <div className="text-sm text-teal-50/90">当前样本</div>
                            <div className="mt-2 text-xl font-bold">{form.sampleId}</div>
                        </div>
                        <div className="rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur">
                            <div className="text-sm text-teal-50/90">结果等级</div>
                            <div className="mt-2 text-xl font-bold">{riskLabel[matchedRule.level]}</div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <TopStat title="分析中任务" value={formatMetric(analyzingCount, 286)} meta="当前待处理任务规模" icon={Activity} />
                <TopStat title="待复核结果" value={formatMetric(reviewCount, 143)} meta="当前等待复核的记录" icon={Database} />
                <TopStat title="高等级预警" value={formatMetric(highRiskCount, 217)} meta="建议优先处理的记录" icon={ShieldCheck} />
                <TopStat title="已归档结果" value={formatMetric(archivedCount, 512)} meta="已完成归档的历史记录" icon={Archive} />
            </section>
            <section className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-8">
                    <div className={cardClass}>
                        <SectionTitle eyebrow="功能模块" title="核心模块" desc="平台围绕样本中心、分析任务、结果中心与处置建议构建统一流程，机理说明模块用于支撑结果解释与方法说明。" />
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button key={item.id} onClick={() => goToPage(item.id)} className="rounded-[24px] border border-teal-100 bg-white p-5 text-left transition hover:border-teal-300 hover:shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                                                <Icon size={18} />
                                            </div>
                                            <ChevronRight size={18} className="text-slate-400" />
                                        </div>
                                        <div className="mt-5 text-lg font-semibold text-slate-900">{item.label}</div>
                                        <div className="mt-2 text-sm leading-7 text-slate-600">进入{item.label}模块，查看对应业务信息与处理内容。</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">近期记录</div>
                                <h3 className="mt-2 text-2xl font-bold text-slate-900">近期分析记录</h3>
                            </div>
                            <button onClick={() => goToPage("samples")} className="rounded-2xl border border-teal-100 px-4 py-2 text-sm font-medium text-slate-700">
                                查看全部
                            </button>
                        </div>
                        <div className="mt-6 overflow-hidden rounded-[24px] border border-teal-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-teal-50/70 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">受理编号</th>
                                    <th className="px-4 py-3 font-medium">样本名称</th>
                                    <th className="px-4 py-3 font-medium">样本类型</th>
                                    <th className="px-4 py-3 font-medium">课题分组</th>
                                    <th className="px-4 py-3 font-medium">状态 / 结果</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dashboardSamples.map((row) => (
                                    <tr key={row.id} className="border-t border-teal-100 bg-white">
                                        <td className="px-4 py-4 font-semibold text-slate-900">{row.accessionNo}</td>
                                        <td className="px-4 py-4 text-slate-600">{row.patient}</td>
                                        <td className="px-4 py-4 text-slate-600">{row.sampleType}</td>
                                        <td className="px-4 py-4 text-slate-600">{row.groupName}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <StatusBadge status={row.status} />
                                                <RiskBadge level={row.risk} />
                                                <button onClick={() => handleViewSampleFromHome(row)} className="text-xs font-medium text-teal-700">
                                                    查看
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {dashboardSamples.length === 0 && (
                                    <tr className="border-t border-teal-100 bg-white">
                                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                                            当前筛选条件下暂无样本记录
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div className="space-y-6 xl:col-span-4">
                    <div className={cardClass}>
                        <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">实时状态</div>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">当前分析概览</h3>
                        <div className="mt-5 space-y-3">
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">样本编号</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{form.sampleId}</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">ECL 强度</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{eclScore}/100</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">综合级联评分</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{amplification.total}%</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">当前结果结论</div>
                                <div className={`mt-1 text-lg font-semibold ${riskColor[matchedRule.level]}`}>{matchedRule.result}</div>
                            </div>
                        </div>
                    </div>
                    <div className={cardClass}>
                        <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">运行提示</div>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">当前处理提示</h3>
                        <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                            <div className="rounded-2xl bg-teal-50/60 px-4 py-3">当前分析模板：{form.template}，建议结合原始信号、实验条件和其他指标结果综合判断。</div>
                            <div className="rounded-2xl bg-teal-50/60 px-4 py-3">高等级结果应优先进入人工复核流程，中等级结果建议补充分析并视情况复测。</div>
                            <div className="rounded-2xl bg-teal-50/60 px-4 py-3">待复核结果建议检查前处理质量、阈值设置和信号放大一致性。</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const samplesPage = (
        <div className="space-y-6">
            <section className={cardClass}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">样本中心</div>
                        <h2 className="mt-2 text-3xl font-bold text-slate-900">样本管理与检索</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600">集中管理编号、样本类型、课题分组、项目成员、记录时间和当前分析状态，支持日常管理、结果筛选与流程追踪。</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button onClick={handleImportSamples} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                            导入数据
                        </button>
                        <button onClick={handleOpenCreateModal} className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white">
                            新建样本
                        </button>
                    </div>
                </div>
            </section>
            <section className={cardClass}>
                <div className="grid gap-4 md:grid-cols-4">
                    <TopStat title="样本总数" value={formatMetric(samples.length, 1284)} meta="当前平台累计样本规模" icon={Database} />
                    <TopStat title="分析中任务" value={formatMetric(analyzingCount, 286)} meta="当前待处理任务规模" icon={Activity} />
                    <TopStat title="待复核" value={formatMetric(reviewCount, 143)} meta="需进一步判断的结果" icon={ShieldCheck} />
                    <TopStat title="已归档" value={formatMetric(archivedCount, 512)} meta="已完成归档的结果记录" icon={Archive} />
                </div>
            </section>
            <section className={cardClass}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-slate-500">
                        <Search size={16} />
                        <input
                            value={sampleQuery}
                            onChange={(e) => {
                                setSampleQuery(e.target.value);
                                setSamplePage(1);
                            }}
                            placeholder="搜索编号、样本名称、项目成员、分组、模板或结果等级"
                            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none">
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.key} value={option.key}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => setSamplePage(1)} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                            筛选
                        </button>
                        <button onClick={handleExportList} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                            导出列表
                        </button>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                    {SAMPLE_TABS.map((tab) => {
                        const active = sampleFilter === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => {
                                    setSampleFilter(tab);
                                    setSamplePage(1);
                                }}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-teal-600 text-white" : "border border-teal-100 bg-white text-slate-600 hover:border-teal-300"}`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-6 overflow-hidden rounded-[24px] border border-teal-100">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-teal-50/70 text-slate-500">
                        <tr>
                            <th className="px-4 py-3 font-medium">受理编号</th>
                            <th className="px-4 py-3 font-medium">样本名称</th>
                            <th className="px-4 py-3 font-medium">样本类型</th>
                            <th className="px-4 py-3 font-medium">课题分组</th>
                            <th className="px-4 py-3 font-medium">项目成员</th>
                            <th className="px-4 py-3 font-medium">记录时间</th>
                            <th className="px-4 py-3 font-medium">版本</th>
                            <th className="px-4 py-3 font-medium">分析状态</th>
                            <th className="px-4 py-3 font-medium">结果等级</th>
                            <th className="px-4 py-3 font-medium">操作</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedSamples.map((row) => (
                            <tr key={row.id} className="border-t border-teal-100 bg-white">
                                <td className="px-4 py-4 font-semibold text-slate-900">{row.accessionNo}</td>
                                <td className="px-4 py-4 text-slate-600">{row.patient}</td>
                                <td className="px-4 py-4 text-slate-600">{row.sampleType}</td>
                                <td className="px-4 py-4 text-slate-600">{row.groupName}</td>
                                <td className="px-4 py-4 text-slate-600">{row.owner}</td>
                                <td className="px-4 py-4 text-slate-600">{row.receivedAt}</td>
                                <td className="px-4 py-4 text-slate-600">V{row.version}</td>
                                <td className="px-4 py-4">
                                    <StatusBadge status={row.status} />
                                </td>
                                <td className="px-4 py-4">
                                    <RiskBadge level={row.risk} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => handleViewReport(row)} className="rounded-xl border border-teal-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                            查看结果
                                        </button>
                                        <button onClick={() => handleContinueAnalysis(row)} className="rounded-xl border border-teal-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                            继续编辑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {paginatedSamples.length === 0 && (
                            <tr className="border-t border-teal-100 bg-white">
                                <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                                    没有匹配到样本，请尝试调整筛选条件或搜索关键词。
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-teal-100 pt-5 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-500">
                        当前筛选：<span className="font-semibold text-slate-900">{sampleFilter}</span> · 搜索词：
                        <span className="font-semibold text-slate-900"> {sampleQuery || "无"}</span> · 共
                        <span className="font-semibold text-slate-900"> {filteredSamples.length}</span> 条
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSamplePage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="inline-flex items-center gap-2 rounded-2xl border border-teal-100 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                            <ChevronLeft size={16} /> 上一页
                        </button>
                        {Array.from({ length: totalSamplePages }, (_, i) => i + 1).map((page) => (
                            <button key={page} onClick={() => setSamplePage(page)} className={`h-10 w-10 rounded-2xl text-sm font-medium ${currentPage === page ? "bg-teal-600 text-white" : "border border-teal-100 bg-white text-slate-700"}`}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setSamplePage((p) => Math.min(totalSamplePages, p + 1))} disabled={currentPage === totalSamplePages} className="inline-flex items-center gap-2 rounded-2xl border border-teal-100 bg-white px-3 py-2 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                            下一页 <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );

    const principlePage = (
        <div className="space-y-6">
            <section className={cardClass}>
                <SectionTitle eyebrow="机理说明" title="检测机理与结果解释支持" desc="该页面用于帮助用户理解输入识别、限域逻辑计算、双级联放大与 ECL 输出机制，从而增强结果可解释性。" />
                <div className="mt-8 grid gap-4 md:grid-cols-4">
                    {[
                        ["01", "折纸自组装", "捕获探针、逻辑计算单元与报告模块集成到单一折纸结构。"],
                        ["02", "限域逻辑计算", "利用纳米级空间约束缩短分子间距离，加速逻辑计算。"],
                        ["03", "双级联放大", "切割循环与链置换扩增共同增强弱信号检测能力。"],
                        ["04", "ECL 映射输出", "将多靶标输入信息映射为可读的电化学发光强度。"],
                    ].map(([idx, title, desc]) => (
                        <div key={idx} className="rounded-[24px] border border-teal-100 bg-white p-5">
                            <div className="text-xs font-semibold tracking-[0.25em] text-slate-400">{idx}</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{title}</div>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{desc}</p>
                        </div>
                    ))}
                </div>
            </section>
            <section className="grid gap-6 lg:grid-cols-2">
                <div className={cardClass}>
                    <h3 className="text-xl font-semibold text-slate-900">判读说明</h3>
                    <div className="mt-5 space-y-4">
                        {[
                            "捕获区：用于识别目标 miRNA 输入信号。",
                            "计算区：用于判断多靶标组合是否命中规则。",
                            "报告区：用于输出 ECL 强度并对应结果等级。",
                            "可结合结果等级、输入特征和实验设计进行综合分析。",
                        ].map((item) => (
                            <div key={item} className="rounded-2xl bg-teal-50/60 px-4 py-3 text-sm text-slate-700">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
                <div className={cardClass}>
                    <h3 className="text-xl font-semibold text-slate-900">项目能力特点</h3>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        {[
                            ["高灵敏度", "双级联放大增强弱信号检测能力"],
                            ["抗干扰", "空间隔离降低非特异性吸附与逻辑串扰"],
                            ["高响应速度", "限域效应缩短逻辑计算与信号产生时间"],
                            ["可解释", "结果与逻辑链路、ECL 输出可对应追踪"],
                        ].map(([title, desc]) => (
                            <div key={title} className="rounded-2xl border border-teal-100 p-4">
                                <div className="text-base font-semibold text-slate-900">{title}</div>
                                <div className="mt-2 text-sm text-slate-600">{desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );

    const detectPage = (
        <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-4">
                <div className={cardClass}>
                    <SectionTitle eyebrow="分析任务" title="样本信息与分析参数" desc="录入样本信息与 miRNA 指标后，平台自动完成输入识别、信号放大分析与规则判读。" />
                    <div className="mt-6 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={labelClass}>样本名称</label>
                                <input className={inputClass} value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>受理编号</label>
                                <input className={inputClass} value={form.accessionNo} onChange={(e) => setForm({ ...form, accessionNo: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>分组属性</label>
                                <select className={inputClass} value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                                    <option>A组</option>
                                    <option>B组</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>样本属性</label>
                                <input className={inputClass} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClass}>课题分组</label>
                                <select className={inputClass} value={form.groupName} onChange={(e) => setForm({ ...form, groupName: e.target.value })}>
                                    <option>课题A组</option>
                                    <option>课题B组</option>
                                    <option>课题C组</option>
                                    <option>课题D组</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>样本编号</label>
                            <input className={inputClass} value={form.sampleId} onChange={(e) => setForm({ ...form, sampleId: e.target.value })} />
                        </div>
                        <div>
                            <label className={labelClass}>样本类型</label>
                            <select className={inputClass} value={form.sampleType} onChange={(e) => setForm({ ...form, sampleType: e.target.value })}>
                                <option>体液</option>
                                <option>血清</option>
                                <option>血浆</option>
                                <option>组织</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>项目说明 / 分析目的</label>
                            <input className={inputClass} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className={labelClass}>项目成员</label>
                                <input className={inputClass} value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                            </div>
                            <div>
                                <label className={labelClass}>记录时间</label>
                                <input className={inputClass} value={form.receivedAt} onChange={(e) => setForm({ ...form, receivedAt: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>逻辑模板</label>
                            <select className={inputClass} value={form.template} onChange={(e) => setForm({ ...form, template: e.target.value })}>
                                <option>乳腺癌早筛模板</option>
                                <option>转移风险评估模板</option>
                                <option>多标志物联合识别模板</option>
                            </select>
                        </div>
                        {([
                            ["miR-21", "mir21"],
                            ["miR-155", "mir155"],
                            ["miR-10b", "mir10b"],
                        ] as const).map(([title, key]) => (
                            <div key={key}>
                                <label className={labelClass}>{title}</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                                    className="w-full"
                                />
                                <div className="mt-2 text-sm text-slate-600">当前值：{form[key].toFixed(2)}</div>
                            </div>
                        ))}
                        <div>
                            <label className={labelClass}>阳性阈值</label>
                            <input type="number" min="0" max="1" step="0.01" className={inputClass} value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="space-y-6 xl:col-span-8">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className={cardClass}>
                        <h3 className="text-xl font-semibold text-slate-900">逻辑输入状态</h3>
                        <div className="mt-5 grid grid-cols-3 gap-3">
                            {[
                                { key: "m21", name: "miR-21", value: inputState.m21 },
                                { key: "m155", name: "miR-155", value: inputState.m155 },
                                { key: "m10b", name: "miR-10b", value: inputState.m10b },
                            ].map((item) => (
                                <div key={item.key} className="rounded-2xl border border-teal-100 p-4 text-center">
                                    <div className="text-xs uppercase tracking-wide text-slate-500">{item.name}</div>
                                    <div className={`mt-2 text-2xl font-bold ${item.value ? "text-emerald-600" : "text-slate-400"}`}>{item.value ? "1" : "0"}</div>
                                    <div className="mt-1 text-xs text-slate-500">{item.value ? "阳性" : "阴性"}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className={cardClass}>
                        <h3 className="text-xl font-semibold text-slate-900">任务执行信息</h3>
                        <div className="mt-5 space-y-3">
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">当前模板</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{form.template}</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">样本类型</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{form.sampleType}</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">项目成员</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{form.owner || "待填写"}</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">即时结果</div>
                                <div className={`mt-1 text-lg font-semibold ${riskColor[matchedRule.level]}`}>{matchedRule.result}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={handleSaveDraft} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">保存草稿</button>
                    <button onClick={handleSaveAnalysis} className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white">保存分析并生成结果</button>
                    <button onClick={() => goToPage("samples")} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">返回样本管理</button>
                </div>
                {analysisError && <div className="text-sm font-medium text-rose-500">{analysisError}</div>}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className={cardClass}>
                        <div className="text-sm text-slate-500">一级放大</div>
                        <div className="mt-2 text-lg font-semibold">捕获与切割放大</div>
                        <div className="mt-4 h-3 w-full rounded-full bg-slate-100">
                            <div className="h-3 rounded-full bg-teal-500" style={{ width: `${amplification.stage1}%` }} />
                        </div>
                        <div className="mt-2 text-sm text-slate-600">放大效率：{amplification.stage1}%</div>
                    </div>
                    <div className={cardClass}>
                        <div className="text-sm text-slate-500">二级放大</div>
                        <div className="mt-2 text-lg font-semibold">链置换与报告放大</div>
                        <div className="mt-4 h-3 w-full rounded-full bg-slate-100">
                            <div className="h-3 rounded-full bg-teal-500" style={{ width: `${amplification.stage2}%` }} />
                        </div>
                        <div className="mt-2 text-sm text-slate-600">放大效率：{amplification.stage2}%</div>
                    </div>
                    <div className={cardClass}>
                        <div className="text-sm text-slate-500">综合评分</div>
                        <div className="mt-2 text-lg font-semibold">综合级联信号</div>
                        <div className="mt-4 h-3 w-full rounded-full bg-slate-100">
                            <div className="h-3 rounded-full bg-teal-700" style={{ width: `${amplification.total}%` }} />
                        </div>
                        <div className="mt-2 text-sm text-slate-600">综合评分：{amplification.total}%</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const resultPage = (
        <div className="space-y-6">
            <section className={cardClass}>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">结果中心</div>
                        <h2 className="mt-3 text-3xl font-bold text-slate-900">miRNA 智能分析结果报告</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-600">依据当前样本的多靶标 miRNA 检测结果、限域逻辑识别规则与双级联放大分析，平台生成结构化结果报告，重点服务于规则验证、结果说明与结构化输出。</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {currentSample && <StatusBadge status={currentSample.status} />}
                        <RiskBadge level={matchedRule.level} />
                    </div>
                </div>
                <div className="mt-6 rounded-[20px] border border-teal-100 bg-teal-50/70 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                                <ClipboardList size={22} />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-900">标准结果报告</div>
                                <div className="text-xs text-slate-500">miRNA 智能分析结果报告</div>
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">报告编号：{form.accessionNo}</div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
                        <InfoField label="样本名称" value={form.patientName || "未填写"} />
                        <InfoField label="分组属性" value={form.sex} />
                        <InfoField label="样本属性" value={form.age || "未填写"} />
                        <InfoField label="课题分组" value={form.groupName} />
                        <InfoField label="项目成员" value={form.owner || "待填写"} />
                        <InfoField label="样本编号" value={form.sampleId} />
                    </div>
                </div>
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-2">
                        <div className="rounded-[24px] border border-teal-200 bg-teal-700 p-6 text-white">
                            <div className="text-sm text-teal-50/90">结果摘要</div>
                            <div className="mt-2 text-3xl font-bold">{matchedRule.result}</div>
                            <p className="mt-4 text-sm leading-7 text-teal-50/90">{matchedRule.explanation}</p>
                            <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-7 text-teal-50/95">说明建议：{matchedRule.suggestion}</div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">命中规则</div>
                                <div className="mt-2 text-2xl font-bold text-slate-900">{matchedRule.name}</div>
                                <div className={`mt-3 text-base font-semibold ${riskColor[matchedRule.level]}`}>结果等级：{riskLabel[matchedRule.level]}</div>
                            </div>
                            <div className={softCardClass}>
                                <div className="text-sm text-slate-500">输入特征</div>
                                <div className="mt-2 text-2xl font-bold text-slate-900">{currentSignature}</div>
                                <div className="mt-3 text-sm text-slate-600">对应 miR-21 / miR-155 / miR-10b 离散化状态</div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className={cardClass}>
                            <div className="text-sm text-slate-500">ECL 强度</div>
                            <div className="mt-2 text-3xl font-bold text-slate-900">{eclScore}/100</div>
                            <div className="mt-4 h-5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-teal-700" style={{ width: `${eclScore}%` }} />
                            </div>
                            <div className="mt-4 text-sm text-slate-500">综合级联评分</div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">{amplification.total}%</div>
                            <div className="mt-4 text-sm text-slate-500">版本号</div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">V{currentSample?.version || 1}</div>
                        </div>
                        <div className={cardClass}>
                            <div className="text-sm text-slate-500">样本编号</div>
                            <div className="mt-2 text-lg font-semibold text-slate-900">{form.sampleId}</div>
                            <div className="mt-4 text-sm text-slate-500">记录时间</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{form.receivedAt || "待补充"}</div>
                            <div className="mt-4 text-sm text-slate-500">样本名称</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{form.patientName || "未填写"}</div>
                            <div className="mt-4 text-sm text-slate-500">课题分组</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{form.groupName}</div>
                            <div className="mt-4 text-sm text-slate-500">项目说明 / 分析目的</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{form.purpose || "未填写"}</div>
                            <div className="mt-4 text-sm text-slate-500">项目成员</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{form.owner || "待填写"}</div>
                            <div className="mt-4 text-sm text-slate-500">分析模板</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{form.template}</div>
                            <div className="mt-4 text-sm text-slate-500">创建时间</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{currentSample?.createdAt || form.receivedAt}</div>
                            <div className="mt-4 text-sm text-slate-500">最后更新时间</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">{currentSample?.updatedAt || form.receivedAt}</div>
                        </div>
                    </div>
                </div>
            </section>
            <section className={cardClass}>
                <div className="flex flex-wrap gap-3">
                    <button onClick={handleExportReport} className="inline-flex items-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                        <Download size={16} /> 导出结果
                    </button>
                    <button onClick={handlePrintReport} className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white">
                        <Printer size={16} /> 打印结果
                    </button>
                    <button onClick={handleArchiveCurrent} className="inline-flex items-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                        <Archive size={16} /> 归档结果
                    </button>
                </div>
            </section>
        </div>
    );

    const followupPage = (
        <div className="space-y-6">
            <section className={cardClass}>
                <SectionTitle eyebrow="处置建议" title="结果分层建议与后续处理思路" desc="基于当前规则判读结果，提供分层建议、后续分析思路与补充实验提示。" />
                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-[24px] border border-teal-200 bg-teal-50/70 p-6">
                        <div className="text-sm font-semibold text-teal-700">高等级结果</div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">优先复核与进一步分析</div>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="rounded-2xl bg-white px-4 py-3">建议结合更多分子指标、原始信号与实验条件综合分析。</div>
                            <div className="rounded-2xl bg-white px-4 py-3">建议优先进入人工复核与组内讨论流程。</div>
                        </div>
                    </div>
                    <div className="rounded-[24px] border border-cyan-200 bg-cyan-50/70 p-6">
                        <div className="text-sm font-semibold text-cyan-700">中等级结果</div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">建议补充分析</div>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="rounded-2xl bg-white px-4 py-3">建议结合既往实验结果和当前规则输出进行趋势比较。</div>
                            <div className="rounded-2xl bg-white px-4 py-3">必要时补充复测并优化参数设置。</div>
                        </div>
                    </div>
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-6">
                        <div className="text-sm font-semibold text-emerald-700">低等级 / 待复核结果</div>
                        <div className="mt-3 text-2xl font-bold text-slate-900">常规记录与质量核查</div>
                        <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div className="rounded-2xl bg-white px-4 py-3">低等级结果可按常规记录方式纳入项目汇总。</div>
                            <div className="rounded-2xl bg-white px-4 py-3">待复核结果优先检查前处理质量与阈值设定。</div>
                        </div>
                    </div>
                </div>
            </section>
            <section className={cardClass}>
                <h3 className="text-2xl font-semibold text-slate-900">当前结果建议</h3>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <TopStat title="当前等级" value={riskLabel[matchedRule.level]} meta="对应当前结果等级" icon={ClipboardList} />
                    <TopStat title="项目说明" value={form.purpose || "未填写"} meta="项目目的 / 结果背景" icon={FileText} />
                    <TopStat title="项目成员" value={form.owner || "未填写"} meta="当前记录负责人" icon={UserCircle2} />
                    <TopStat title="建议处理" value={matchedRule.level === "High" ? "优先复核" : matchedRule.level === "Medium" ? "补充分析" : "常规记录"} meta="系统基于结果等级生成" icon={Activity} />
                </div>
            </section>
        </div>
    );

    const aboutPage = (
        <div className="space-y-6">
            <section className={cardClass}>
                <SectionTitle eyebrow="平台信息" title="平台信息与能力说明" desc="平台面向癌症 miRNA 智能分析场景，强调规则判读流程、结果解释支持与结构化输出。" />
                <div className="mt-8 grid gap-6 lg:grid-cols-3">
                    <div className={softCardClass}>
                        <div className="text-lg font-semibold text-slate-900">应用背景</div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">针对低丰度 miRNA 检测与多靶标区分需求，提供更易解释的分析界面与流程支撑。</p>
                    </div>
                    <div className={softCardClass}>
                        <div className="text-lg font-semibold text-slate-900">核心能力</div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">支持样本管理、检测分析、规则分层、结果报告生成与完整流程闭环。</p>
                    </div>
                    <div className={softCardClass}>
                        <div className="text-lg font-semibold text-slate-900">扩展方向</div>
                        <p className="mt-3 text-sm leading-7 text-slate-600">后续可与实验数据平台、项目数据库和分析模块联动，形成更完整的科研分析与管理系统。</p>
                    </div>
                </div>
            </section>
            <section className={cardClass}>
                <h3 className="text-2xl font-semibold text-slate-900">平台能力矩阵</h3>
                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        "样本管理与筛选",
                        "项目成员与时间追踪",
                        "多指标检测分析",
                        "规则分层与即时提示",
                        "结构化结果报告输出",
                        "分层结果建议",
                        "结果解释支持",
                        "项目流程适配",
                        "后续数据库联动",
                    ].map((item) => (
                        <div key={item} className="rounded-2xl border border-teal-100 bg-white px-4 py-4 text-sm text-slate-700">
                            {item}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );

    const pageContent: Record<PageId, React.ReactNode> = {
        login: loginPage,
        home: homePage,
        samples: samplesPage,
        principle: principlePage,
        detect: detectPage,
        result: resultPage,
        followup: followupPage,
        about: aboutPage,
    };

    const createSampleModal = isCreateModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[28px] border border-teal-100 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">新建样本</div>
                        <h3 className="mt-2 text-2xl font-bold text-slate-900">基础信息录入</h3>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(false)} className="rounded-2xl border border-teal-100 px-3 py-2 text-sm text-slate-600">
                        关闭
                    </button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                        <label className={labelClass}>样本名称</label>
                        <input className={inputClass} value={newSample.patientName} onChange={(e) => setNewSample((prev) => ({ ...prev, patientName: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelClass}>项目成员</label>
                        <input className={inputClass} value={newSample.owner} onChange={(e) => setNewSample((prev) => ({ ...prev, owner: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelClass}>分组属性</label>
                        <select className={inputClass} value={newSample.sex} onChange={(e) => setNewSample((prev) => ({ ...prev, sex: e.target.value }))}>
                            <option>A组</option>
                            <option>B组</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>样本属性</label>
                        <input className={inputClass} value={newSample.age} onChange={(e) => setNewSample((prev) => ({ ...prev, age: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelClass}>课题分组</label>
                        <select className={inputClass} value={newSample.groupName} onChange={(e) => setNewSample((prev) => ({ ...prev, groupName: e.target.value }))}>
                            <option>课题A组</option>
                            <option>课题B组</option>
                            <option>课题C组</option>
                            <option>课题D组</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>样本类型</label>
                        <select className={inputClass} value={newSample.sampleType} onChange={(e) => setNewSample((prev) => ({ ...prev, sampleType: e.target.value }))}>
                            <option>血清</option>
                            <option>血浆</option>
                            <option>体液</option>
                            <option>组织</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>项目说明 / 分析目的</label>
                        <input className={inputClass} value={newSample.purpose} onChange={(e) => setNewSample((prev) => ({ ...prev, purpose: e.target.value }))} />
                    </div>
                </div>
                {createError && <div className="mt-4 text-sm font-medium text-rose-500">{createError}</div>}
                <div className="mt-6 flex flex-wrap gap-3">
                    <button onClick={handleCreateSample} className="rounded-2xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white">
                        创建并进入分析
                    </button>
                    <button onClick={resetNewSample} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                        重置
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div className="min-h-screen bg-teal-50/40 text-slate-900">
            <div className="mx-auto max-w-[1600px] p-4 lg:p-6">
                <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                    <aside className="rounded-[32px] border border-teal-100 bg-gradient-to-b from-teal-500 to-cyan-500 p-5 text-white shadow-lg">
                        <div className="rounded-[24px] border border-white/15 bg-white/10 p-4">
                            <div className="text-xs tracking-[0.12em] text-teal-50">ZHEGUANG INTELLIGENCE</div>
                            <div className="mt-2 flex items-start gap-2 text-base font-bold leading-6 lg:text-lg">
                                <GraduationCap size={22} className="mt-0.5 shrink-0" /> 折光智诊-一种基于动态可编程DNA分子决策网络的肿瘤诊断方法及系统
                            </div>
                            <div className="mt-2 text-xs tracking-[0.08em] text-teal-50/80">Cancer miRNA Analysis Platform</div>
                        </div>
                        <nav className="mt-6 space-y-2">
                            {NAV_ITEMS.map((item) => {
                                const Icon = item.icon;
                                const isActive = activePage === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => goToPage(item.id)}
                                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${isActive ? "bg-white text-teal-700" : "text-teal-50/85 hover:bg-white/10 hover:text-white"}`}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="mt-8 rounded-[24px] border border-white/15 bg-white/10 p-4">
                            <div className="text-sm text-teal-50/85">系统状态</div>
                            <div className="mt-2 text-lg font-semibold">运行中</div>
                            <div className="mt-4 h-2 rounded-full bg-white/10">
                                <div className="h-2 w-[82%] rounded-full bg-teal-300" />
                            </div>
                            <div className="mt-3 text-xs text-teal-50/80">分析模块与数据流程已连接</div>
                        </div>
                    </aside>
                    <div className="space-y-6">
                        <header className="rounded-[32px] border border-teal-100 bg-white px-5 py-4 shadow-sm">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="text-xs font-semibold tracking-[0.12em] text-teal-700">平台名称</div>
                                    <div className="mt-1 text-2xl font-bold text-slate-900">折光智诊-一种基于动态可编程DNA分子决策网络的肿瘤诊断方法及系统</div>
                                    <div className="mt-2 text-sm leading-6 text-slate-500">基于DNA折纸与逻辑电化学发光的癌症miRNA智能诊断平台</div>
                                </div>
                                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                    <div className="flex items-center gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-sm text-slate-500">
                                        <Search size={16} />
                                        <input
                                            value={globalSearch}
                                            onChange={(e) => setGlobalSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleGlobalSearch();
                                            }}
                                            placeholder={isAuthenticated ? "搜索样本、结果" : "请先登录后使用搜索"}
                                            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                                            disabled={!isAuthenticated}
                                        />
                                    </div>
                                    <button onClick={handleGlobalSearch} disabled={!isAuthenticated} className="rounded-2xl border border-teal-100 bg-white p-3 text-teal-700 disabled:cursor-not-allowed disabled:opacity-50">
                                        <Search size={18} />
                                    </button>
                                    <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-4 py-2.5">
                                        <UserCircle2 size={24} className="text-slate-500" />
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">{isAuthenticated ? "当前用户" : "访客模式"}</div>
                                            <div className="text-xs text-slate-500">{isAuthenticated ? "平台已授权" : "请先登录"}</div>
                                        </div>
                                    </div>
                                    {isAuthenticated && (
                                        <button onClick={handleLogout} className="rounded-2xl border border-teal-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                                            退出
                                        </button>
                                    )}
                                </div>
                            </div>
                        </header>
                        <main>
                            {toastMessage && (
                                <div className="mb-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-700">
                                    <div className="flex items-center justify-between gap-4">
                                        <span>{toastMessage}</span>
                                        <button onClick={() => setToastMessage("")} className="text-xs font-medium text-teal-700">
                                            关闭
                                        </button>
                                    </div>
                                </div>
                            )}
                            {isAuthenticated ? pageContent[activePage] : loginPage}
                        </main>
                    </div>
                </div>
            </div>
            {createSampleModal}
        </div>
    );
}
