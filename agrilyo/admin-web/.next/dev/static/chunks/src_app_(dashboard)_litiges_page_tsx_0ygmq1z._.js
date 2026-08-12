(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/(dashboard)/litiges/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LitigesPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const STATUTS = [
    "OUVERT",
    "MEDIATION",
    "RESOLU",
    "ESCALADE"
];
const STATUT_LABELS = {
    OUVERT: "Ouverts",
    MEDIATION: "En médiation",
    RESOLU: "Résolus",
    ESCALADE: "Escaladés (AFOR)"
};
const STATUT_BADGE = {
    OUVERT: "bg-erreur/10 text-erreur",
    MEDIATION: "bg-alerte/10 text-alerte",
    RESOLU: "bg-succes/10 text-succes",
    ESCALADE: "bg-gray-200 text-gray-600"
};
// Transitions autorisées depuis chaque statut — évite de proposer une action invalide
const TRANSITIONS = {
    OUVERT: [
        {
            vers: "MEDIATION",
            label: "Passer en médiation",
            primary: true
        },
        {
            vers: "ESCALADE",
            label: "Escalader vers l'AFOR"
        }
    ],
    MEDIATION: [
        {
            vers: "RESOLU",
            label: "Marquer comme résolu",
            primary: true
        },
        {
            vers: "ESCALADE",
            label: "Escalader vers l'AFOR"
        }
    ],
    RESOLU: [],
    ESCALADE: [
        {
            vers: "RESOLU",
            label: "Marquer comme résolu",
            primary: true
        }
    ]
};
function formatDate(iso) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}
function LitigesPage() {
    _s();
    const [statut, setStatut] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("OUVERT");
    const [litiges, setLitiges] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [resolutionDrafts, setResolutionDrafts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [actionPendingId, setActionPendingId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const charger = (s)=>{
        setLoading(true);
        setError(null);
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].get("/foncier/litiges", {
            statut: s,
            size: 50
        }).then((res)=>setLitiges(res.items)).catch((err)=>setError(err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] ? err.message : "Erreur de chargement")).finally(()=>setLoading(false));
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LitigesPage.useEffect": ()=>{
            charger(statut);
        }
    }["LitigesPage.useEffect"], [
        statut
    ]);
    const handleResoudre = async (id, nouveauStatut)=>{
        const resolution = resolutionDrafts[id]?.trim();
        if (nouveauStatut === "RESOLU" && !resolution) {
            alert("Décrivez la résolution avant de clôturer ce litige.");
            return;
        }
        if (!window.confirm(`Confirmer : ${STATUT_LABELS[nouveauStatut]} ?`)) return;
        setActionPendingId(id);
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].patch(`/foncier/litiges/${id}/resoudre`, {
                statut: nouveauStatut,
                resolution: resolution || null
            });
            setLitiges((prev)=>prev.filter((l)=>l.id !== id));
        } catch (err) {
            alert(err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ApiError"] ? err.message : "Action impossible");
        } finally{
            setActionPendingId(null);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "text-2xl font-bold text-gray-800",
                        children: "Litiges"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                        lineNumber: 89,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-500",
                        children: "Différends déclarés sur des contrats fonciers"
                    }, void 0, false, {
                        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                        lineNumber: 90,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                lineNumber: 88,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: STATUTS.map((s)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setStatut(s),
                        className: `rounded-full px-4 py-1.5 text-sm font-medium transition ${statut === s ? "bg-vertForet text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`,
                        children: STATUT_LABELS[s]
                    }, s, false, {
                        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-gray-400",
                children: "Chargement..."
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                lineNumber: 109,
                columnNumber: 19
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-erreur",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                lineNumber: 110,
                columnNumber: 17
            }, this),
            !loading && !error && litiges.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "rounded-xl bg-white p-6 text-center text-sm text-gray-400",
                children: [
                    "Aucun litige ",
                    STATUT_LABELS[statut].toLowerCase(),
                    " pour le moment."
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                lineNumber: 113,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: litiges.map((litige)=>{
                    const transitions = TRANSITIONS[statut];
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-xl bg-white p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-start justify-between gap-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: `rounded-full px-2 py-0.5 text-xs font-medium ${STATUT_BADGE[statut]}`,
                                                    children: STATUT_LABELS[statut]
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                                    lineNumber: 126,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-gray-400",
                                                    children: [
                                                        "Déclaré le ",
                                                        formatDate(litige.created_at)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                                    lineNumber: 131,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                            lineNumber: 125,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-2 text-sm text-gray-700",
                                            children: litige.description
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                            lineNumber: 135,
                                            columnNumber: 19
                                        }, this),
                                        litige.resolution && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-3 rounded-lg bg-cremeIvoire p-3",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs font-medium uppercase text-gray-400",
                                                    children: "Résolution"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                                    lineNumber: 138,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "mt-1 text-sm text-gray-700",
                                                    children: litige.resolution
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                                    lineNumber: 139,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                            lineNumber: 137,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                    lineNumber: 124,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                lineNumber: 123,
                                columnNumber: 15
                            }, this),
                            transitions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 space-y-3 border-t border-gray-100 pt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                                        placeholder: "Décrire la résolution (obligatoire pour clôturer)",
                                        value: resolutionDrafts[litige.id] ?? "",
                                        onChange: (e)=>setResolutionDrafts((prev)=>({
                                                    ...prev,
                                                    [litige.id]: e.target.value
                                                })),
                                        rows: 2,
                                        className: "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-vertForet focus:outline-none"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                        lineNumber: 147,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap gap-2",
                                        children: transitions.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>handleResoudre(litige.id, t.vers),
                                                disabled: actionPendingId === litige.id,
                                                className: `rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${t.primary ? "bg-vertForet text-white hover:bg-vertSavane" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`,
                                                children: t.label
                                            }, t.vers, false, {
                                                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                                lineNumber: 158,
                                                columnNumber: 23
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                        lineNumber: 156,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                                lineNumber: 146,
                                columnNumber: 17
                            }, this)
                        ]
                    }, litige.id, true, {
                        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                        lineNumber: 122,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
                lineNumber: 118,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/(dashboard)/litiges/page.tsx",
        lineNumber: 87,
        columnNumber: 5
    }, this);
}
_s(LitigesPage, "KvG2jJyqsSXEG/wmzWtdC8q0zfc=");
_c = LitigesPage;
var _c;
__turbopack_context__.k.register(_c, "LitigesPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_app_%28dashboard%29_litiges_page_tsx_0ygmq1z._.js.map