import { useState } from "react";
import PassClustering from "../components/AnalysisHub/PassClustering";
import XG from "../components/AnalysisHub/XG";
import XT from "../components/AnalysisHub/XT";

export default function AnalysisHub() {
    const [activeTab, setActiveTab] = useState("pass");

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Analysis Hub</h2>

            <div className="flex space-x-4 mb-6 border-b pb-2">
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