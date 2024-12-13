export const SidebarItem = ({ icon, title, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
            active
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
    >
        <span className="mr-3">{icon}</span>
        {title}
    </button>
); 