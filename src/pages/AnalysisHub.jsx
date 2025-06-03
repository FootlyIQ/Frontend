import { useState } from "react";
import PassClustering from "../components/AnalysisHub/PassClustering";
import XG from "../components/AnalysisHub/XG";
import XT from "../components/AnalysisHub/XT";

export default function AnalysisHub() {
    const [activeTab, setActiveTab] = useState("pass");

    return (
        <div className="p-4 bg-slate-800">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-50">Analysis Hub</h2>
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400">Powered by</span>
                    {/* Replace this inline SVG with your actual Premier League SVG/logo */}
                    <img src="/premier-league-1.svg" alt="Premier League logo" className="h-20 w-auto" />
                </div>
            </div>

            <div className="flex space-x-4 mb-6 border-b border-gray-50 pb-2">
                <button
                    onClick={() => setActiveTab("pass")}
                    className={`px-4 py-2 rounded-t ${
                        activeTab === "pass"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    Pass Clustering
                </button>
                <button
                    onClick={() => setActiveTab("xg")}
                    className={`px-4 py-2 rounded-t ${
                        activeTab === "xg"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    xG
                </button>
                <button
                    onClick={() => setActiveTab("xt")}
                    className={`px-4 py-2 rounded-t ${
                        activeTab === "xt"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    xT
                </button>
            </div>

            <div className="mt-4">
                {activeTab === "pass" && <PassClustering />}
                {activeTab === "xg" && <XG />}
                {activeTab === "xt" && <XT />}
            </div>
        </div>
    );
}