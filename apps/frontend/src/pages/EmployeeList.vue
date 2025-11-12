<template>
  <div class="employee-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>员工列表</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加员工
          </el-button>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="search-filter">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索姓名、邮箱或电话"
              prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="searchForm.department_id"
              placeholder="选择部门"
              clearable
            >
              <el-option
                v-for="dept in departments"
                :key="dept.department_id"
                :label="dept.department_name"
                :value="dept.department_id"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select
              v-model="searchForm.status"
              placeholder="选择状态"
              clearable
            >
              <el-option label="在职" value="active" />
              <el-option label="离职" value="resigned" />
              <el-option label="休假" value="on_leave" />
              <el-option label="停用" value="inactive" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <div class="filter-actions">
              <el-button type="primary" @click="search">搜索</el-button>
              <el-button @click="resetFilters">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 员工列表 -->
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="employeesData"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="employee_id" label="员工ID" width="100" />
          <el-table-column prop="first_name" label="姓氏" width="100" />
          <el-table-column prop="last_name" label="名字" width="100" />
          <el-table-column prop="email" label="邮箱" width="200" />
          <el-table-column prop="phone" label="电话" width="150" />
          <el-table-column prop="department.department_name" label="部门" width="150" />
          <el-table-column prop="position.position_name" label="职位" width="150" />
          <el-table-column prop="hire_date" label="入职日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag
                :type="getStatusTagType(scope.row.status)"
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button type="primary" link size="small" @click="viewEmployee(scope.row.employee_id)">
                查看
              </el-button>
              <el-button type="warning" link size="small" @click="editEmployee(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" link size="small" @click="deleteEmployee(scope.row.employee_id)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 员工编辑对话框组件 -->
    <EmployeeEditDialog
      v-model="editDialogVisible"
      :employee-data="currentEmployee"
      :departments="departments"
      :positions="positions"
      :is-edit-mode="isEditMode"
      @saved="handleEmployeeSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, View, Edit, Delete, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import employeeApi from '../api/employeeApi'
import departmentApi from '../api/departmentApi'
import positionApi from '../api/positionApi'
import EmployeeEditDialog from '../components/EmployeeEditDialog.vue'

export default {
  name: 'EmployeeList',
  components: {
    Plus,
    View,
    Edit,
    Delete,
    Search,
    EmployeeEditDialog
  },
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const editDialogVisible = ref(false)
    const isEditMode = ref(false)
    const currentEmployee = ref({})
    const selectedEmployees = ref([])
    
    // 分页数据
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    })
    
    // 搜索表单
    const searchForm = reactive({
      keyword: '',
      department_id: '',
      status: ''
    })
    

    
    // 部门数据
    const departments = ref([])
    
    // 职位数据
    const positions = ref([])
    
    // 员工数据
    const employeesData = ref([])
    
    // 获取部门列表
    const getDepartments = async () => {
      try {
        const response = await departmentApi.getDepartments({ page: 1, limit: 100 })
        departments.value = response.data || []
      } catch (error) {
        ElMessage.error('获取部门列表失败')
      }
    }
    
    // 获取职位列表
    const getPositions = async () => {
      try {
        const response = await positionApi.getPositions({ page: 1, limit: 100 })
        positions.value = response.data || []
      } catch (error) {
        ElMessage.error('获取职位列表失败')
      }
    }
    
    // 获取员工列表
    const getEmployees = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...searchForm
        }
        
        // 实际调用API
        const response = await employeeApi.getEmployees(params)
        employeesData.value = response.data || []
        pagination.total = response.pagination?.total || 0
      } catch (error) {
        ElMessage.error('获取员工列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 搜索
    const search = () => {
      pagination.page = 1
      getEmployees()
    }
    
    // 重置筛选条件
    const resetFilters = () => {
      Object.keys(searchForm).forEach(key => {
        searchForm[key] = ''
      })
      pagination.page = 1
      getEmployees()
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      isEditMode.value = false
      currentEmployee.value = {}
      editDialogVisible.value = true
    }
    
    // 编辑员工
    const editEmployee = (row) => {
      isEditMode.value = true
      currentEmployee.value = { ...row }
      editDialogVisible.value = true
    }
    
    // 查看员工详情
    const viewEmployee = (id) => {
      router.push(`/employees/${id}`)
    }
    
    // 删除员工
    const deleteEmployee = async (id) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除该员工吗？此操作不可撤销。',
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        // 实际调用API
        await employeeApi.deleteEmployee(id)
        
        ElMessage.success('员工删除成功')
        getEmployees()
      } catch (error) {
        // 用户取消删除
      }
    }
    
    // 处理编辑组件保存后的回调
    const handleEmployeeSaved = () => {
      getEmployees()
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedEmployees.value = selection
    }
    
    // 处理页面大小变化
    const handleSizeChange = (size) => {
      pagination.limit = size
      getEmployees()
    }
    
    // 处理页码变化
    const handleCurrentChange = (current) => {
      pagination.page = current
      getEmployees()
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        active: '在职',
        resigned: '离职',
        on_leave: '休假',
        inactive: '停用'
      }
      return statusMap[status] || status
    }
    
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      const typeMap = {
        active: 'success',
        resigned: 'danger',
        on_leave: 'warning',
        inactive: 'info'
      }
      return typeMap[status] || 'default'
    }
    
    // 监听全局刷新事件
    const setupRefreshListener = () => {
      window.addEventListener('refresh-employees-data', getEmployees)
    }

    // 页面加载时获取数据
    onMounted(() => {
      getDepartments()
      getPositions()
      getEmployees()
      setupRefreshListener()
    })
    
    return {
      loading,
      editDialogVisible,
      isEditMode,
      currentEmployee,
      pagination,
      searchForm,
      departments,
      positions,
      employeesData,
      selectedEmployees,
      search,
      resetFilters,
      showAddDialog,
      editEmployee,
      viewEmployee,
      deleteEmployee,
      handleEmployeeSaved,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      getStatusText,
      getStatusTagType
    }
  }
}
</script>

<style scoped>
.employee-list-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filter {
  margin-bottom: 20px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.table-container {
  margin-bottom: 20px;
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>