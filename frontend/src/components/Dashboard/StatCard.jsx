export const StatCard = ({ title, value, color }) => (
    <div className={`${color} p-6 rounded-lg shadow-md`}>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
); 