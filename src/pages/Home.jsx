import Navbar from "../components/Navbar";
import MatchFeed from "../components/MatchFeed";
import RightSidebar from "../components/RightSidebar";


export default function Home() {

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-800 text-gray-900">
            
            <main className="flex-1 p-6 bg-slate-800">
                <MatchFeed />
            </main>
            <RightSidebar />
        </div>
    );
}
