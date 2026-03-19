import { Link } from 'react-router-dom';
import { formatTime } from '../utils/formatTime';

const GoodsCard = ({ item }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* 商品图片 */}
      <Link to={`/product/${item.id}`}>
        <div className="h-48 bg-neutral flex items-center justify-center">
          <img 
            src={item.image || 'https://via.placeholder.com/300x200?text=商品图片'} 
            alt={item.name}
            className="w-full h-full object-cover rounded-t-lg"
          />
        </div>
      </Link>
      {/* 商品信息 */}
      <div className="p-4">
        <Link to={`/product/${item.id}`}>
          <h3 className="font-medium text-lg mb-2 hover:text-primary">{item.name}</h3>
        </Link>
        <p className="text-primary font-bold mb-2">¥{item.price}</p>
        <p className="text-gray-500 text-sm mb-3">{formatTime(item.createTime)}</p>
        <button className="btn-primary w-full">加入购物车</button>
      </div>
    </div>
  );
};

export default GoodsCard;