import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Form, Input, DatePicker, Select, Button, message, Typography, Spin, Row, Col, Table, Tag, Modal, Space, Popconfirm, notification, Descriptions, Collapse, InputNumber } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, SaveOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, EditOutlined, EyeOutlined, UnorderedListOutlined, CaretRightOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import api from '../../api';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { debounce } from 'lodash';

// Extend dayjs với các plugin cần thiết
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(customParseFormat);

const { Title } = Typography;
const { Option } = Select;

// Danh sách xã/phường của thị xã Tịnh Biên
const COMMUNES = [
    'Phường Nhà Bàng',
    'Phường Tịnh Biên',
    'Xã An Cư',
    'Xã An Hảo',
    'Xã An Nông',
    'Xã An Phú',
    'Xã Chi Lăng',
    'Xã Nhơn Hưng',
    'Xã Núi Voi',
    'Xã Tân Lập',
    'Xã Tân Lợi',
    'Xã Thới Sơn',
    'Xã Văn Giáo',
    'Xã Vĩnh Trung'
].sort(); // Sắp xếp theo alphabet

// Mapping xã phường v khóm/ấp tương ứng
const HAMLET_MAPPING = {
    'Phường Nhà Bàng': [
        'Khóm 1', 'Khóm 2', 'Khóm 3', 'Khóm 4', 'Khóm 5', 'Khóm 6', 'Khóm 7', 'Khóm 8',
        'Khóm Xuân Hòa', 'Khóm Xuân Khánh'
    ],
    'Phường Tịnh Biên': [
        'Khóm 1', 'Khóm 2', 'Khóm 3', 'Khóm 4', 'Khóm 5', 'Khóm 6', 'Khóm 7', 'Khóm 8',
        'Khóm Đông An', 'Khóm Thạnh Mỹ'
    ],
    'Xã An Cư': [
        'Ấp An Bình', 'Ấp An Hòa', 'Ấp An Thạnh A', 'Ấp An Thạnh B', 'Ấp Phước Hng',
        'Ấp Thạnh Phú', 'Ấp Thạnh Hòa'
    ],
    'Xã An Hảo': [
        'Ấp An Hảo', 'Ấp An Hòa', 'Ấp An Thạnh', 'Ấp Hảo Thạnh', 'Ấp Thạnh Hòa',
        'Ấp Thnh Ph��', 'p Thạnh Tây'
    ],
    'Xã An Nông': [
        'Ấp An Hòa', 'Ấp An Thạnh', 'Ấp Bình Thạnh', 'Ấp Thạnh Hòa', 'Ấp Thạnh Phú',
        'Ấp Thạnh Tây', 'Ấp Thới Sơn'
    ],
    'Xã An Phú': [
        'Ấp An Hưng', 'Ấp An Thạnh', 'Ấp Phú Thạnh', 'Ấp Thạnh An', 'Ấp Thạnh Hòa',
        'Ấp Thạnh Phú', 'Ấp Thạnh Tây'
    ],
    'Xã Chi Lăng': [
        'Ấp Chi Lăng', 'Ấp Phước Thạnh', 'Ấp Thạnh Hòa', 'Ấp Thạnh Phú', 'Ấp Thạnh Tây',
        'Ấp Thới Sơn', 'Ấp Vĩnh Thạnh'
    ],
    'Xã Nhơn Hưng': [
        'Ấp Hưng Thạnh 1', 'Ấp Hưng Thạnh 2', 'Ấp Nhơn Hòa 1', 'Ấp Nhơn Hòa 2', 
        'Ấp Thạnh Hưng', 'p Thạnh Ph', 'Ấp Thạnh Tây'
    ],
    'Xã Núi Voi': [
        'Ấp Núi Két', 'p Núi Voi', 'Ấp Thạnh Đức', 'Ấp Voi Lớn', 'Ấp Thạnh Hòa',
        'Ấp Thạnh Phú', 'Ấp Thạnh Tây'
    ],
    'Xã Tân Lập': [
        'Ấp Tân An', 'Ấp Tân Hòa', 'Ấp Tân Thạnh', 'Ấp Thạnh Tân', 'Ấp Thạnh Hòa',
        'Ấp Thạnh Phú', 'Ấp Thnh Tây'
    ],
    'Xã Tân Lợi': [
        'Ấp Tân Hòa', 'Ấp Tn Phú', 'Ấp Tân Thạnh', 'Ấp Thnh Lợi', 'Ấp Thạnh Ha',
        'Ấp Thạnh Phú', 'Ấp Thạnh Tây'
    ],
    'Xã Thới Sơn': [
        'Ấp Thới Hòa', 'Ấp Thới Thuận', 'Ấp Thới Thạnh A', 'Ấp Thới Thạnh B',
        'Ấp Thạnh Hòa', 'Ấp Thạnh Phú', 'Ấp Thạnh Tây'
    ],
    'Xã Văn Giáo': [
        'Ấp Phước Thạnh', 'Ấp Thạnh Hòa', 'Ấp Văn Giáo A', 'Ấp Văn Giáo B',
        'Ấp Thạnh Phú', 'Ấp Thạnh Tây', 'Ấp Vĩnh Thạnh'
    ],
    'Xã Vĩnh Trung': [
        'p Trung An', 'Ấp Trung Hòa', 'Ấp Vĩnh Hòa', 'Ấp Vĩnh Thạnh',
        'Ấp Thạnh Hòa', 'Ấp Thạnh Phú', 'Ấp Thạnh Tây'
    ]
};

// Thêm constant chứa danh sách bnh viện
const HOSPITALS = [
    'Trung tâm y tế thành phố Châu Đốc',
    'Bệnh viện đa khoa Nhật Tân',
    'Phòng Khám Đa Khoa Lữ Văn Trạng',
    'Bệnh viện đa khoa khu vực tỉnh',
    'Trạm y tế P. Châu Phú A',
    'Trạm y tế P. Châu Phú B',
    'Trạm y tế P. Vĩnh Mỹ',
    'Trạm y tế xã Vĩnh Tế',
    'Trạm y tế xã Vĩnh Ngươn',
    'Trạm y tế P. Ni Sam',
    'Trạm y tế xã Vĩnh Châu',
    'Trung tâm Y tế thành phố Long Xuyên',
    'Trung tâm Y t huyện An Phú',
    'Bệnh viện đa khoa khu vực Tân Châu',
    'Trung tâm Y t huyện Phú Tân',
    'Trung tâm Y tế huyện Tịnh Biên',
    'Trung tâm Y tế huyện Tri Tôn',
    'Trung tâm Y tế huyện Châu Phú',
    'Trung tâm Y tế huyện Chợ Mới',
    'Trung tâm Y tế huyện Châu Thành',
    'Trung tâm Y tế huyện Thoại Sơn',
    'Bệnh viện đa khoa TT - AG',
    'Bệnh viện Mắt - TMH - RHM',
    'Bệnh viện Tim Mạạch',
    'YTCQ Trường Cao đẳng nghề An Giang',
    'Trung tâm Đông Y châm cứu',
    'Phòng chẩn trị DY thành phố Long Xuyên',
    // ... thêm tất cả các bệnh viện khác
].sort(); // Sắp xếp theo alphabet

const DeclarationForm = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { batchId } = useParams();
    const [loading, setLoading] = useState(false);
    const [loadingDeclarations, setLoadingDeclarations] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searching, setSearching] = useState(false);
    const [declarations, setDeclarations] = useState([]);
    const [batch, setBatch] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [hamlets, setHamlets] = useState([]);
    const [objectType, setObjectType] = useState(null);
    const [isAllDeclarationsModalVisible, setIsAllDeclarationsModalVisible] = useState(false);
    const [submitAttempts, setSubmitAttempts] = useState(0);
    const [selectedDeclaration, setSelectedDeclaration] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState({});
    const [supportAmount, setSupportAmount] = useState(0);
    const [isListExpanded, setIsListExpanded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const [supportAmountPerDeclaration, setSupportAmountPerDeclaration] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [totalSupportAmount, setTotalSupportAmount] = useState(0);

    // Lấy thông tin user và batch
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setLoadingDeclarations(true);

                // Lấy thông tin user
                const userResponse = await api.get('/auth/me');
                setUserInfo(userResponse.data);

                // Lấy thông tin batch và declarations
                const [batchResponse, declarationsResponse] = await Promise.all([
                    api.get(`/declarations/employee/batch/${batchId}`),
                    api.get(`/declarations/employee/batch/${batchId}/declarations`)
                ]);

                if (batchResponse.data) {
                    setBatch(batchResponse.data);
                    
                    // Set giá trị mặc định cho form
                    const defaultValues = {
                        province: 'An Giang',
                        district: 'Thị xã Tịnh Biên',
                        commune: userResponse.data?.commune,
                        hospital_code: 'Trung tâm Y tế huyện Tịnh Biên',
                        months: '12',
                        receipt_date: dayjs(),
                        participant_number: batchResponse.data.object_type === 'DTTS' ? '1' : undefined
                    };
                    
                    form.setFieldsValue(defaultValues);
                    setObjectType(batchResponse.data.object_type);
                }

                // Xử lý danh sách kê khai
                if (declarationsResponse.data) {
                    setDeclarations(declarationsResponse.data || []);
                    // Tính tổng số tiền ban đầu
                    const total = (declarationsResponse.data || []).reduce((sum, item) => sum + (item.actual_amount || 0), 0);
                    setTotalAmount(total);
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                message.error('Có lỗi xảy ra khi tải dữ liệu');
            } finally {
                setLoading(false);
                setLoadingDeclarations(false);
            }
        };

        if (batchId) {
            fetchData();
        }
    }, [batchId, form]);

    // Thêm xử lý phím tắt
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key.toLowerCase() === 's') {
                event.preventDefault(); // Ngăn chặn hành vi mặc định của phím S
                if (!submitting && submitAttempts < 5) {
                    form.submit();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [form, submitting, submitAttempts]);

    // Xử lý khi thay đổi ngày tháng
    const handleDateChange = useCallback(() => {
        const receipt_date = form.getFieldValue('receipt_date');
        
        // Nếu không có ngày biên lai, không làm gì cả
        if (!receipt_date) return;

        let new_date = null;

        // Xử lý đơn giản theo từng loại đối tượng
        if (objectType === 'DTTS') {
            // Đối với DTTS: lấy ngày đầu tháng
            new_date = dayjs(receipt_date).startOf('month');
        } else {
            // Đối với các loại khác: + 30 ngày
            new_date = dayjs(receipt_date).add(30, 'day');
        }

        // Cập nhật ngày mới
        if (new_date) {
            form.setFieldsValue({
                new_card_effective_date: new_date
            });
        }
    }, [form, objectType]);

    // Xử lý khi chọn ngày biên lai
    const handleReceiptDateSelect = (date) => {
        if (!date) return;
        
        // Đảm bảo date là một đối tượng dayjs hợp lệ
        const validDate = dayjs(date);
        if (!validDate.isValid()) return;
        
        form.setFieldsValue({
            receipt_date: validDate
        });
        
        // Tính toán ngày hiệu lực mới
        let new_date = null;
        
        if (objectType === 'DTTS') {
            new_date = validDate.startOf('month');
        } else {
            new_date = validDate.add(30, 'day');
        }
        
        if (new_date && new_date.isValid()) {
            form.setFieldsValue({
                new_card_effective_date: new_date
            });
        }
    };

    // Thêm useEffect để theo dõi sự thay đổi của các trường liên quan
    useEffect(() => {
        handleDateChange();
    }, [handleDateChange]);

    // Cập nhật lại form item cho trường new_card_effective_date
    const renderNewCardEffectiveDateField = () => (
        <Form.Item
            name="new_card_effective_date"
            label={<span className="text-sm">Ngày thẻ mới có hiệu lực</span>}
            rules={[{ required: true, message: 'Vui lòng chọn ngày thẻ mới có hiệu lực' }]}
        >
            <DatePicker 
                className="w-full h-9" 
                format="DD/MM/YYYY" 
                disabled={true}
                placeholder="Ngày thẻ mới có hiệu lực"
            />
        </Form.Item>
    );

    // Xử lý response data từ tìm kiếm
    const handleSearchResponse = useCallback((responseData) => {
        if (!responseData) return;
        
        const formData = {
            ...responseData,
            birth_date: responseData.birth_date ? dayjs(responseData.birth_date) : undefined,
            receipt_date: dayjs(),
            old_card_expiry_date: responseData.old_card_expiry_date ? 
                dayjs(responseData.old_card_expiry_date) : undefined,
            new_card_effective_date: undefined,
            // Giữ lại các giá trị mặc định
            province: 'An Giang',
            district: 'Thị xã Tịnh Biên',
            hospital_code: 'Trung tâm Y tế huyện Tịnh Biên',
            months: '12'
        };

        // Validate các trường ngày tháng
        Object.keys(formData).forEach(key => {
            if (formData[key] && dayjs.isDayjs(formData[key]) && !formData[key].isValid()) {
                formData[key] = undefined;
            }
        });

        form.setFieldsValue(formData);
        handleDateChange();
    }, [form, handleDateChange]);

    // Debounce search function
    const debouncedSearch = useCallback(
        debounce(async (values) => {
            try {
                setSearching(true);
                const timestamp = new Date().getTime();
                const response = await api.get('/declarations/search/bhxh', {
                    params: {
                        bhxh_code: values.bhxh_code,
                        cccd: values.cccd,
                        batch_id: batchId,
                        _t: timestamp
                    },
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                
                if (response.data.success) {
                    handleSearchResponse(response.data.data);
                }
            } catch (error) {
                console.error('Search error:', error);
                if (error.response?.status === 404) {
                    message.info('Không tìm thấy thông tin BHYT');
                    // Không làm gì cả, giữ nguyên form hiện tại
                } else {
                    let errorMessage = 'Có lỗi xảy ra khi tìm kiếm';
                    if (error.response?.data) {
                        if (error.response.data.message) {
                            errorMessage = error.response.data.message;
                        } else if (error.response.data.error) {
                            errorMessage = error.response.data.error;
                        }
                    }
                    message.error(errorMessage);
                }
            } finally {
                setSearching(false);
            }
        }, 500),
        [batchId, form, handleSearchResponse]
    );

    // Hàm xử lý tìm kiếm
    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    // Hàm xử lý reset tìm kiếm
    const handleSearchReset = (clearFilters, confirm) => {
        clearFilters();
        setSearchText('');
        confirm();
    };

    const getColumnSearchProps = (dataIndex, title) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div className="p-4">
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${title}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    className="mb-2 block w-full"
                />
                <div className="flex justify-between">
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        className="w-24"
                    >
                        Tìm
                    </Button>
                    <Button
                        onClick={() => handleSearchReset(clearFilters, confirm)}
                        size="small"
                        className="w-24"
                    >
                        Đặt lại
                    </Button>
                </div>
            </div>
        ),
        filterIcon: filtered => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value, record) =>
            record[dataIndex]
                ?.toString()
                .toLowerCase()
                .includes(value.toLowerCase()),
        onFilterDropdownOpenChange: visible => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        }
    });

    // Hàm tính ngày thẻ mới có hiệu lực
    const calculateNewCardEffectiveDate = (objectType, receiptDate, oldCardExpiryDate) => {
        if (!objectType || !receiptDate) return null;
        
        const receipt = dayjs(receiptDate);

        // Trường hợp đối tượng DTTS
        if (objectType === 'DTTS') {
            // Ngày đầu tháng của ngày biên lai
            return receipt.startOf('month');
        }

        // Trường hợp đối tượng HGD và NLNN
        if (objectType === 'HGD' || objectType === 'NLNN') {
            // Nếu không có ngày hết hạn thẻ cũ
            if (!oldCardExpiryDate) {
                return receipt.add(30, 'day');
            }

            // Tính số ngày chênh lệch giữa ngày hết hạn thẻ cũ và ngày biên lai
            const diffDays = Math.abs(dayjs(oldCardExpiryDate).diff(receipt, 'day'));

            // Nếu số ngày chênh lệch nhỏ hơn 90 ngày
            if (diffDays < 90) {
                return receipt.add(1, 'day');
            } 
            // Nếu số ngày chênh lệch lớn hơn hoặc bằng 90 ngày
            else {
                return receipt.add(30, 'day');
            }
        }

        return null;
    };

    // Xử lý khi click vào dòng trong bảng
    const handleRowClick = (record) => {
        setSelectedDeclaration(record);
        const formData = {
            ...record,
            birth_date: record.birth_date ? dayjs(record.birth_date) : undefined,
            receipt_date: record.receipt_date ? dayjs(record.receipt_date) : dayjs(),
            old_card_expiry_date: record.old_card_expiry_date ? dayjs(record.old_card_expiry_date) : undefined,
            new_card_effective_date: record.new_card_effective_date ? dayjs(record.new_card_effective_date) : undefined,
            originalBhxhCode: record.bhxh_code,
            originalCccd: record.cccd,
            isEdit: true
        };
        form.setFieldsValue(formData);
    };

    // Xử lý xóa kê khai
    const handleDelete = async (record) => {
        try {
            const response = await api.delete(`/declarations/employee/declaration/${record.id}`);
            if (response.data.success) {
                message.success('Đã xóa kê khai thành công');
                setDeclarations(prev => prev.filter(item => item.id !== record.id));
            }
        } catch (error) {
            console.error('Error deleting declaration:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa kê khai');
        }
    };

    // Cấu hình cột cho bảng
    const columns = [
        {
            title: 'Mã BHXH',
            dataIndex: 'bhxh_code',
            key: 'bhxh_code',
            width: 120,
            fixed: 'left',
            ...getColumnSearchProps('bhxh_code', 'mã BHXH')
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            width: 180,
            fixed: 'left',
            ...getColumnSearchProps('full_name', 'họ tên')
        },
        {
            title: 'CCCD',
            dataIndex: 'cccd',
            key: 'cccd',
            width: 140,
            ...getColumnSearchProps('cccd', 'CCCD')
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'birth_date',
            key: 'birth_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 100,
            filters: [
                { text: 'Nam', value: 'Nam' },
                { text: 'Nữ', value: 'Nữ' }
            ],
            onFilter: (value, record) => record.gender === value
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number',
            width: 120,
            ...getColumnSearchProps('phone_number', 'số điện thoại')
        },
        {
            title: 'Số người tham gia',
            dataIndex: 'participant_number',
            key: 'participant_number',
            width: 150,
            filters: [
                { text: '1 người', value: '1' },
                { text: '2 người', value: '2' },
                { text: '3 người', value: '3' },
                { text: '4 người', value: '4' },
                { text: '5 người', value: '5' }
            ],
            onFilter: (value, record) => record.participant_number === value
        },
        {
            title: 'Số biên lai',
            dataIndex: 'receipt_number',
            key: 'receipt_number',
            width: 120,
            ...getColumnSearchProps('receipt_number', 'số biên lai')
        },
        {
            title: 'Ngày biên lai',
            dataIndex: 'receipt_date',
            key: 'receipt_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Ngày hết hạn thẻ cũ',
            dataIndex: 'old_card_expiry_date',
            key: 'old_card_expiry_date',
            width: 150,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Ngày hiệu lực thẻ mới',
            dataIndex: 'new_card_effective_date',
            key: 'new_card_effective_date',
            width: 150,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Số tháng đóng',
            dataIndex: 'months',
            key: 'months',
            width: 120,
            filters: [
                { text: '3 tháng', value: '3' },
                { text: '6 tháng', value: '6' },
                { text: '12 tháng', value: '12' }
            ],
            onFilter: (value, record) => record.months === value
        },
        {
            title: 'Phương án',
            dataIndex: 'plan',
            key: 'plan',
            width: 100,
            filters: [
                { text: 'Tăng mới', value: 'TM' },
                { text: 'Đáo hạn', value: 'ON' }
            ],
            onFilter: (value, record) => record.plan === value,
            render: (plan) => plan === 'TM' ? 'Tăng mới' : 'Đáo hạn'
        },
        {
            title: 'Thao tác',
            key: 'action', 
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                    >
                        Xóa
                    </Button>
                </Space>
            )
        }
    ];

    // Hàm lấy tên đối tượng
    const getObjectTypeName = (type) => {
        switch (type) {
            case 'HGD':
                return 'H gia đình';
            case 'DTTS':
                return 'Dn tộc thiểu số';
            case 'NLNN':
                return 'Nng lâm ngư nghiệp';
            default:
                return '';
        }
    };

    // Xử lý submit form
    const onFinish = async (values) => {
        try {
            setSubmitting(true);
            
            // Chuẩn bữ liệu cơ bản
            const formData = {
                ...values,
                batch_id: batchId,
                object_type: batch?.object_type,
                birth_date: values.birth_date?.format('YYYY-MM-DD'),
                receipt_date: values.receipt_date?.format('YYYY-MM-DD'),
                old_card_expiry_date: values.old_card_expiry_date?.format('YYYY-MM-DD'),
                new_card_effective_date: values.new_card_effective_date?.format('YYYY-MM-DD'),
                isEdit: selectedDeclaration ? true : false,
                originalBhxhCode: selectedDeclaration?.bhxh_code,
                originalCccd: selectedDeclaration?.cccd
            };

            // Kiểm tra các trường bắt buộc
            const requiredFields = [
                'bhxh_code',
                'full_name',
                'birth_date',
                'gender',
                'cccd',
                'phone_number',
                'receipt_date',
                'receipt_number',
                'months',
                'plan',
                'commune',
                'participant_number',
                'hospital_code',
                'new_card_effective_date'
            ];

            const missingFields = requiredFields.filter(field => !formData[field]);
            if (missingFields.length > 0) {
                message.error(`Vui lòng điền đầy đủ các trường: ${missingFields.join(', ')}`);
                return;
            }

            // Gọi API tạo/cập nhật kê khai
            const response = await api.post('/declarations/employee/declaration', formData);

            if (response.data.success) {
                message.success(selectedDeclaration ? 'Cập nhật kê khai thành công' : 'Tạo kê khai thành công');
                refreshDeclarations();
                form.resetFields();
                setSelectedDeclaration(null);
            }
        } catch (error) {
            console.error('Submit error:', error);
            let errorMessage = 'Có lỗi xảy ra khi lưu kê khai';
            if (error.response?.data) {
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            }
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Thêm nút Reset để hủy chỉnh sửa
    const handleFormReset = () => {
        Modal.confirm({
            title: 'Xác nhận hủy',
            content: 'Bạn có chắc chắn muốn hủy? Mội thông tin đã nhập sẽ bị mất.',
            okText: 'Đồng ý',
            cancelText: 'Hủy',
            onOk: () => {
                form.resetFields();
                setSelectedDeclaration(null);
            }
        });
    };

    // Xử lý khi chọn xã/phường
    const handleCommuneChange = (value) => {
        form.setFieldValue('hamlet', undefined); // Reset giá trị khóm/ấp
        setHamlets(HAMLET_MAPPING[value] || []);
    };

    // Xử lý khi thay đổi quận/huyện
    const handleDistrictChange = (value) => {
        if (value === 'Thị xã Tịnh Biên') {
            form.setFieldsValue({
                hospital_code: 'Trung tâm Y tế huyện Tịnh Biên'
            });
        }
    };

    // Hàm refresh danh sách kê khai
    const refreshDeclarations = async () => {
        try {
            setLoadingDeclarations(true);
            const timestamp = new Date().getTime();
            const response = await api.get(`/declarations/employee/batch/${batchId}/declarations`, {
                params: { _t: timestamp },
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            if (response.data) {
                setDeclarations(response.data);
            }
        } catch (error) {
            console.error('Error refreshing declarations:', error);
            message.error('Không thể tải lại danh sách kê khai');
        } finally {
            setLoadingDeclarations(false);
        }
    };

    const showDetailModal = (record) => {
        setSelectedDeclaration(record);
        setIsDetailModalVisible(true);
    };

    const handleDetailModalClose = () => {
        setIsDetailModalVisible(false);
        setSelectedDeclaration(null);
    };

    const detailColumns = [
        {
            title: 'Mã BHXH',
            dataIndex: 'bhxh_code',
            key: 'bhxh_code',
            width: 120,
            fixed: 'left'
        },
        {
            title: 'Họ và tên',
            dataIndex: 'full_name',
            key: 'full_name',
            width: 180
        },
        {
            title: 'CCCD',
            dataIndex: 'cccd',
            key: 'cccd',
            width: 140
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'birth_date',
            key: 'birth_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 100
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone_number',
            key: 'phone_number',
            width: 120
        },
        {
            title: 'Số người tham gia',
            dataIndex: 'participant_number',
            key: 'participant_number',
            width: 150
        },
        {
            title: 'Số biên lai',
            dataIndex: 'receipt_number',
            key: 'receipt_number',
            width: 120
        },
        {
            title: 'Ngày biên lai',
            dataIndex: 'receipt_date',
            key: 'receipt_date',
            width: 120,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Ngày hết hạạn thẻ cũ',
            dataIndex: 'old_card_expiry_date',
            key: 'old_card_expiry_date',
            width: 150,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Ngày hiệu lực thẻ mới',
            dataIndex: 'new_card_effective_date',
            key: 'new_card_effective_date',
            width: 150,
            render: (date) => date ? dayjs(date).format('DD/MM/YYYY') : ''
        },
        {
            title: 'Số tháng đóng',
            dataIndex: 'months',
            key: 'months',
            width: 120
        },
        {
            title: 'Phương án đóng',
            dataIndex: 'plan',
            key: 'plan',
            width: 150
        },
        {
            title: 'Xã/Phường',
            dataIndex: 'commune',
            key: 'commune',
            width: 150
        },
        {
            title: 'Khóm/Ấp',
            dataIndex: 'hamlet',
            key: 'hamlet',
            width: 150
        },
        {
            title: 'Bệnh viện đăng ký',
            dataIndex: 'hospital_code',
            key: 'hospital_code',
            width: 200
        },
        {
            title: 'Số tiền phải đóng',
            dataIndex: 'actual_amount',
            key: 'actual_amount',
            width: 150,
            render: (amount) => new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount)
        }
    ];

    // Hàm tính tổng số tiền
    const calculateTotalAmount = useCallback((declarations) => {
        if (!declarations?.length) return 0;
        return declarations.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
    }, []);

    // Tính tổng số tiền khi declarations thay đổi
    useEffect(() => {
        const total = calculateTotalAmount(declarations);
        setTotalAmount(total);
    }, [declarations, calculateTotalAmount]);

    // Xử lý khi thay đổi số tiền h��� trợ
    const handleSupportAmountChange = (value) => {
        const numValue = Number(value) || 0;
        setSupportAmountPerDeclaration(numValue);
        const total = numValue * (declarations?.length || 0);
        setTotalSupportAmount(total);
    };

    const renderAllDeclarationsModal = () => {
        return (
            <Modal
                title={
                    <div className="flex justify-between items-center">
                        <span>Danh sách chi tiết tất cả các kê khai</span>
                        <div className="text-sm text-gray-500">
                            Tổng số {declarations?.length || 0} kê khai
                        </div>
                    </div>
                }
                open={isAllDeclarationsModalVisible}
                onCancel={() => setIsAllDeclarationsModalVisible(false)}
                width={1200}
                footer={null}
            >
                <Table
                    columns={columns}
                    dataSource={declarations}
                    scroll={{ x: 1500, y: 500 }}
                    pagination={{
                        total: declarations?.length,
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} kê khai`,
                        showSizeChanger: true,
                        showQuickJumper: true
                    }}
                    size="small"
                    rowKey="id"
                />
                <div className="mt-4 flex justify-between items-center">
                    <div>
                        <div className="font-medium">
                            Tổng số tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                        </div>
                        <div className="font-medium">
                            Tổng tiền hỗ trợ: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSupportAmount)}
                        </div>
                        <div className="font-medium">
                            Số tiền phải đóng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount - totalSupportAmount)}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Số tiền hỗ trợ mỗi kê khai:</span>
                        <InputNumber
                            value={supportAmountPerDeclaration}
                            onChange={handleSupportAmountChange}
                            formatter={value => `${value}`.replace(/\$\s?|(,*)/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            addonAfter="VND"
                            className="w-32"
                            min={0}
                        />
                    </div>
                </div>
            </Modal>
        );
    };

    // Thêm các hàm xử lý modal
    const showAllDeclarationsModal = () => {
        setIsAllDeclarationsModalVisible(true);
    };

    const handleAllDeclarationsModalClose = () => {
        setIsAllDeclarationsModalVisible(false);
    };

    // Xử lý khi thay đổi loại đối tượng
    const handleObjectTypeChange = (value) => {
        console.log('Object type changed:', value);
        
        form.setFieldsValue({
            participant_number: value === 'DTTS' ? '1' : undefined,
            old_card_number: undefined,
            old_card_expiry_date: undefined
        });
        
        setObjectType(value);
        handleDateChange();
    };

    // Tính toán dữ liệu cho trang hiện tại
    const getCurrentPageData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return declarations.slice(startIndex, endIndex);
    };

    // Tính tổng số trang
    const totalPages = Math.ceil((declarations?.length || 0) / pageSize);

    // Xử lý khi chuyển trang
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Cập nhật lại phần hiển thị danh sách
    const renderDeclarationsList = () => {
        if (loadingDeclarations) {
            return (
                <div className="text-center py-8">
                    <Spin />
                </div>
            );
        }

        if (!declarations?.length) {
            return (
                <div className="text-center text-gray-500 py-8">
                    Chưa có kê khai nào trong đợt
                </div>
            );
        }

        return (
            <div className="space-y-3">
                {getCurrentPageData().map(record => (
                    <div 
                        key={record.id}
                        className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(record)}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-medium text-gray-900">{record.full_name}</div>
                                <div className="text-sm text-gray-600">Mã BHXH: {record.bhxh_code}</div>
                                <div className="text-sm text-gray-600">CCCD: {record.cccd}</div>
                            </div>
                            <div className="flex space-x-1">
                                <Button
                                    type="text"
                                    size="middle"
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(record);
                                    }}
                                >
                                    Sửa
                                </Button>
                                <Popconfirm
                                    title="Xóa kê khai"
                                    description="Bạn có chắc chắn muốn xóa kê khai này?"
                                    onConfirm={(e) => {
                                        e.stopPropagation();
                                        handleDelete(record);
                                    }}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button
                                        type="text"
                                        size="middle"
                                        danger
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Xóa
                                    </Button>
                                </Popconfirm>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            Ngày biên lai: {dayjs(record.receipt_date).format('DD/MM/YYYY')}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Xử lý khi thay đổi giá trị tìm kiếm
    const handleSearchValueChange = (field, value) => {
        const trimmedValue = value.trim();
        form.setFieldValue(field, trimmedValue);
        
        // Chỉ tìm kiếm khi đủ số ký tự
        if (trimmedValue && trimmedValue.length >= (field === 'bhxh_code' ? 10 : 12)) {
            setSearching(true);
            api.get('/declarations/search/bhxh', {
                params: {
                    [field]: trimmedValue,
                    batch_id: batchId,
                    _t: new Date().getTime()
                },
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            })
            .then(response => {
                if (response.data.success) {
                    handleSearchResponse(response.data.data);
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                if (error.response?.status === 404) {
                    message.info('Không tìm thấy thông tin BHYT');
                } else {
                    let errorMessage = 'Có lỗi xảy ra khi tìm kiếm';
                    if (error.response?.data) {
                        if (error.response.data.message) {
                            errorMessage = error.response.data.message;
                        } else if (error.response.data.error) {
                            errorMessage = error.response.data.error;
                        }
                    }
                    message.error(errorMessage);
                }
            })
            .finally(() => {
                setSearching(false);
            });
        }
    };

    return (
        <div className="container mx-auto py-2">
            <div className="flex space-x-6">
                {/* Form bên trái */}
                <div className="flex-1">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark="optional"
                        className="bg-white p-4 rounded-lg shadow-lg"
                        size="large"
                        initialValues={{
                            province: 'An Giang',
                            district: 'Thị xã Tịnh Biên',
                            commune: userInfo?.commune,
                            hospital_code: 'Trung tâm Y tế huyện Tịnh Biên',
                            months: '12',
                            receipt_date: dayjs(),
                            participant_number: batch?.object_type === 'DTTS' ? '1' : undefined
                        }}
                    >
                        {/* Thông tin đợt kê khai */}
                        <div className="mb-2 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="px-3 py-2 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-base font-medium text-gray-800">
                                            Đợt kê khai {batch?.batch_number} - Tháng {batch?.month}/{batch?.year}
                                        </h2>
                                        <div className="text-sm text-gray-600">
                                            Đối tượng: {getObjectTypeName(batch?.object_type)}
                                        </div>
                                    </div>
                                    <Button
                                        icon={<ArrowLeftOutlined />}
                                        onClick={() => navigate('/employee/declarations/create/batch')}
                                        size="middle"
                                    >
                                        Quay lại
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Form content */}
                        <div className="px-1">
                            {/* Phần tìm kiếm */}
                            <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="text-base font-medium mb-2 text-blue-800">Tìm kiếm thông tin</div>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="bhxh_code"
                                            label={<span className="text-sm">Mã số BHXH</span>}
                                            rules={[
                                                { pattern: /^\d{10}$/, message: 'Mã BHXH phải có 10 chữ số' }
                                            ]}
                                        >
                                            <Input 
                                                maxLength={10} 
                                                placeholder="Nhập mã BHXH 10 chữ số"
                                                className="h-9"
                                                onChange={(e) => handleSearchValueChange('bhxh_code', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="cccd"
                                            label={<span className="text-sm">CCCD</span>}
                                            rules={[
                                                { pattern: /^\d{12}$/, message: 'CCCD phải có 12 chữ số' }
                                            ]}
                                        >
                                            <Input 
                                                maxLength={12} 
                                                placeholder="Nhập số CCCD"
                                                className="h-9"
                                                onChange={(e) => handleSearchValueChange('cccd', e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Thông tin cá nhân và thẻ BHYT */}
                            <div className="mb-2">
                                <div className="text-base font-medium mb-2 text-gray-800 border-b pb-1">Thông tin cá nhân và thẻ BHYT</div>
                                <Row gutter={16} className="mb-1">
                                    <Col span={8}>
                                        <Form.Item
                                            name="full_name"
                                            label={<span className="text-sm">Họ và tên</span>}
                                            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                                        >
                                            <Input 
                                                placeholder="Nhập họ và tên"
                                                className="h-9"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="birth_date"
                                            label={<span className="text-sm">Ngày sinh</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                                        >
                                            <DatePicker 
                                                className="w-full h-9" 
                                                format="DD/MM/YYYY" 
                                                placeholder="Chọn ngày sinh"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="gender"
                                            label={<span className="text-sm">Giới tính</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
                                        >
                                            <Select 
                                                placeholder="Chọn giới tính"
                                                className="h-9"
                                            >
                                                <Option value="Nam">Nam</Option>
                                                <Option value="Nữ">Nữ</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} className="mb-1">
                                    <Col span={8}>
                                        <Form.Item
                                            name="phone_number"
                                            label={<span className="text-sm">Số điện thoại</span>}
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập số điện thoại' },
                                                { pattern: /^\d{10}$/, message: 'Số điện thoại phải có 10 chữ số' }
                                            ]}
                                        >
                                            <Input maxLength={10} placeholder="Nhập số điện thoại" className="h-9" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="participant_number"
                                            label={<span className="text-sm">Số người tham gia</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn số người tham gia' }]}
                                        >
                                            <Select 
                                                placeholder="Chọn số người"
                                                disabled={objectType === 'DTTS'}
                                                value={objectType === 'DTTS' ? '1' : form.getFieldValue('participant_number')}
                                                className="h-9"
                                            >
                                                <Option value="1">1 người</Option>
                                                <Option value="2">2 người</Option>
                                                <Option value="3">3 người</Option>
                                                <Option value="4">4 người</Option>
                                                <Option value="5">5 người</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="months"
                                            label={<span className="text-sm">Số tháng đóng</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn số tháng đóng' }]}
                                        >
                                            <Select placeholder="Chọn số tháng đóng" className="h-9">
                                                <Option value="3">3 tháng</Option>
                                                <Option value="6">6 tháng</Option>
                                                <Option value="12">12 tháng</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} className="mb-1">
                                    <Col span={8}>
                                        <Form.Item
                                            name="receipt_date"
                                            label={<span className="text-sm">Ngày biên lai</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn ngày biên lai' }]}
                                        >
                                            <DatePicker 
                                                className="w-full h-9" 
                                                format="DD/MM/YYYY"
                                                placeholder="Chọn ngày biên lai"
                                                onChange={handleReceiptDateSelect}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="receipt_number"
                                            label={<span className="text-sm">Số biên lai</span>}
                                            rules={[
                                                { required: true, message: 'Vui lòng nhập số biên lai' },
                                                { pattern: /^\d{7}$/, message: 'Số biên lai phải có 7 chữ số' }
                                            ]}
                                        >
                                            <Input maxLength={7} placeholder="Nhập số biên lai" className="h-9" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="plan"
                                            label={<span className="text-sm">Phương án đóng</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn phương án đóng' }]}
                                        >
                                            <Select placeholder="Chọn phương án" className="h-9">
                                                <Option value="TM">Tăng mới</Option>
                                                <Option value="ON">Đáo hạn</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16} className="mb-1">
                                    <Col span={8}>
                                        <Form.Item
                                            name="old_card_expiry_date"
                                            label={<span className="text-sm">Ngày hết hạn thẻ cũ</span>}
                                        >
                                            <DatePicker 
                                                className="w-full h-9" 
                                                format="DD/MM/YYYY" 
                                                placeholder="Chọn ngày hết hạn thẻ cũ"
                                                onChange={() => handleDateChange()}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="new_card_effective_date"
                                            label={<span className="text-sm">Ngày thẻ mới có hiệu lực</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn ngày thẻ mới có hiệu lực' }]}
                                        >
                                            <DatePicker 
                                                className="w-full h-9" 
                                                format="DD/MM/YYYY" 
                                                disabled={true}
                                                placeholder="Ngày thẻ mới có hiệu lực"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item
                                            name="hospital_code"
                                            label={<span className="text-sm">Bệnh viện đăng ký KCB</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn bệnh viện' }]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Chọn bệnh viện"
                                                optionFilterProp="children"
                                                filterOption={(input, option) =>
                                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }
                                                className="h-9"
                                            >
                                                {HOSPITALS.map(hospital => (
                                                    <Option key={hospital} value={hospital}>
                                                        {hospital}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>

                            {/* Thông tin địa chỉ */}
                            <div className="mb-2">
                                <div className="text-base font-medium mb-2 text-gray-800 border-b pb-1">Thông tin địa chỉ</div>
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Form.Item
                                            name="province"
                                            label={<span className="text-sm">Tỉnh/Thành phố</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn tỉnh/thành phố' }]}
                                        >
                                            <Input 
                                                disabled 
                                                className="h-9 bg-gray-50"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="district"
                                            label={<span className="text-sm">Quận/Huyện</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn quận/huyện' }]}
                                        >
                                            <Input 
                                                disabled 
                                                className="h-9 bg-gray-50"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="commune"
                                            label={<span className="text-sm">Xã/Phường</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn xã/phường' }]}
                                            initialValue={userInfo?.commune}
                                        >
                                            <Input 
                                                disabled 
                                                className="h-9 bg-gray-50"
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="hamlet"
                                            label={<span className="text-sm">Khóm/Ấp</span>}
                                            rules={[{ required: true, message: 'Vui lòng chọn khóm/ấp' }]}
                                        >
                                            <Select 
                                                placeholder="Chọn khóm/ấp"
                                                className="h-9"
                                            >
                                                {hamlets.map(hamlet => (
                                                    <Option key={hamlet} value={hamlet}>
                                                        {hamlet}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        {/* Nút submit */}
                        <div className="flex justify-end bg-white py-3 px-4 -mx-4 border-t border-gray-200 shadow-sm mt-2">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={submitting}
                                icon={<SaveOutlined />}
                                className="h-9 px-6 text-base font-medium"
                            >
                                Lưu
                            </Button>
                        </div>
                    </Form>
                </div>

                {/* Danh sách kê khai dạng card bên phải */}
                <div className="w-[400px]">
                    <div className="bg-white rounded-lg shadow-lg">
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-medium text-gray-800">
                                        Danh sách kê khai trong đợt
                                    </h3>
                                    <span className="text-sm text-gray-500">
                                        {declarations?.length || 0} bản ghi
                                    </span>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<UnorderedListOutlined />}
                                    onClick={showAllDeclarationsModal}
                                    className="h-9 px-4"
                                >
                                    Xem tất cả
                                </Button>
                            </div>
                        </div>
                        
                        <div className="p-4">
                            {declarations?.length > 0 ? (
                                <>
                                    <div className="space-y-3">
                                        {getCurrentPageData().map(record => (
                                            <div 
                                                key={record.id}
                                                className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleRowClick(record)}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{record.full_name}</div>
                                                        <div className="text-sm text-gray-600">Mã BHXH: {record.bhxh_code}</div>
                                                        <div className="text-sm text-gray-600">CCCD: {record.cccd}</div>
                                                    </div>
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            type="text"
                                                            size="middle"
                                                            className="text-blue-600 hover:text-blue-800"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEdit(record);
                                                            }}
                                                        >
                                                            Sửa
                                                        </Button>
                                                        <Popconfirm
                                                            title="Xóa kê khai"
                                                            description="Bạn có chắc chắn muốn xóa kê khai này?"
                                                            onConfirm={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(record);
                                                            }}
                                                            okText="Xóa"
                                                            cancelText="Hủy"
                                                        >
                                                            <Button
                                                                type="text"
                                                                size="middle"
                                                                danger
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </Popconfirm>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Ngày biên lai: {dayjs(record.receipt_date).format('DD/MM/YYYY')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Phân trang */}
                                    {totalPages > 1 && (
                                        <div className="mt-4 flex justify-center">
                                            <div className="flex space-x-1">
                                                <Button
                                                    type="default"
                                                    size="small"
                                                    disabled={currentPage === 1}
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    icon={<LeftOutlined />}
                                                />
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <Button
                                                        key={page}
                                                        type={currentPage === page ? "primary" : "default"}
                                                        size="small"
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                ))}
                                                <Button
                                                    type="default"
                                                    size="small"
                                                    disabled={currentPage === totalPages}
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    icon={<RightOutlined />}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    Chưa có kê khai nào trong đợt
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {renderAllDeclarationsModal()}
        </div>
    );
};

export default DeclarationForm; 