<template>
  <div class="department-list">
    <el-card shadow="always">
      <template #header>
        <div class="card-header">
          <span>部门列表</span>
          <el-button type="primary" @click="handleCreate">
            <el-icon><Plus /></el-icon> 新增部门
          </el-button>
        </div>
      </template>

      <!-- 搜索筛选区域 -->
      <div class="search-filter">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchForm.department_name"
              placeholder="搜索部门名称"
              prefix-icon="Search"
              clearable
            />
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="searchForm.location"
              placeholder="搜索办公地点"
              prefix-icon="Location"
              clearable
            />
          </el-col>
          <el-col :span="8">
            <div class="filter-actions">
              <el-button type="primary" @click="handleSearch">搜索</el-button>
              <el-button @click="resetSearch">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table :data="departments" style="width: 100%">
        <el-table-column prop="department_id" label="部门ID" width="80" />
        <el-table-column prop="department_name" label="部门名称" />
        <el-table-column prop="manager_name" label="部门经理" />
        <el-table-column prop="location" label="办公地点" />
        <el-table-column prop="employee_count" label="员工数量" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="handleView(scope.row)">
              查看
            </el-button>
            <el-button type="warning" link size="small" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑部门对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增部门' : '编辑部门'"
      width="500px"
    >
      <el-form
        ref="departmentFormRef"
        :model="departmentForm"
        label-width="100px"
        :rules="rules"
      >
        <el-form-item label="部门名称" prop="department_name">
          <el-input v-model="departmentForm.department_name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门经理" prop="manager_id">
          <el-select v-model="departmentForm.manager_id" placeholder="请选择部门经理">
            <el-option
              v-for="manager in managers"
              :key="manager.employee_id"
              :label="manager.name"
              :value="manager.employee_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="办公地点" prop="location">
          <el-input v-model="departmentForm.location" placeholder="请输入办公地点" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Location } from '@element-plus/icons-vue'
import departmentApi from '../api/departmentApi'
import employeeApi from '../api/employeeApi'

export default {
  name: 'DepartmentList',
  components: {
    Plus,
    Search,
    Location
  },
  setup() {
    const router = useRouter()
    
    // 部门列表数据
    const departments = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    
    // 搜索表单
    const searchForm = reactive({
      department_name: '',
      location: ''
    })
    
    // 对话框相关
    const dialogVisible = ref(false)
    const dialogType = ref('create')
    const departmentFormRef = ref(null)
    
    // 表单数据
    const departmentForm = reactive({
      department_id: null,
      department_name: '',
      manager_id: null,
      location: ''
    })
    
    // 可选经理列表
    const managers = ref([])
    
    // 表单验证规则
    const rules = {
      department_name: [
        { required: true, message: '请输入部门名称', trigger: 'blur' },
        { min: 1, max: 100, message: '部门名称长度在 1 到 100 个字符', trigger: 'blur' }
      ],
      location: [
        { max: 200, message: '办公地点长度不能超过200个字符', trigger: 'blur' }
      ]
    }
    
    // 获取部门列表
    const fetchDepartments = async () => {
      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value
        }
        
        // 添加搜索条件
        if (searchForm.department_name) {
          params.department_name = searchForm.department_name
        }
        if (searchForm.location) {
          params.location = searchForm.location
        }
        
        const response = await departmentApi.getDepartments(params)
        departments.value = response.data
        total.value = response.pagination?.total || 0
      } catch (error) {
        ElMessage.error('获取部门列表失败')
        console.error(error)
      }
    }
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1
      fetchDepartments()
    }
    
    // 重置搜索
    const resetSearch = () => {
      Object.assign(searchForm, {
        department_name: '',
        location: ''
      })
      currentPage.value = 1
      fetchDepartments()
    }
    
    // 获取可选经理
    const fetchManagers = async () => {
      try {
        const response = await employeeApi.getEmployees({
          page: 1,
          limit: 100
        })
        managers.value = response.data.map(item => ({
          employee_id: item.employee_id,
          name: `${item.first_name} ${item.last_name}`
        }))
      } catch (error) {
        ElMessage.error('获取经理列表失败')
        console.error(error)
      }
    }
    
    // 处理新增部门
    const handleCreate = () => {
      dialogType.value = 'create'
      // 重置表单
      departmentFormRef.value?.resetFields()
      Object.assign(departmentForm, {
        department_id: null,
        department_name: '',
        manager_id: null,
        location: ''
      })
      dialogVisible.value = true
    }
    
    // 处理编辑部门
    const handleEdit = (row) => {
      dialogType.value = 'edit'
      Object.assign(departmentForm, row)
      dialogVisible.value = true
    }
    
    // 处理查看部门详情
    const handleView = (row) => {
      // 跳转到部门详情页面
      router.push(`/departments/${row.department_id}`)
    }
    
    // 处理删除部门
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除部门「${row.department_name}」吗？`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          await departmentApi.deleteDepartment(row.department_id)
          ElMessage.success('删除成功')
          fetchDepartments() // 重新获取列表
        } catch (error) {
          ElMessage.error('删除失败')
          console.error(error)
        }
      }).catch(() => {
        // 取消删除
      })
    }
    
    // 提交表单
    const handleSubmit = async () => {
      try {
        await departmentFormRef.value.validate()
        
        if (dialogType.value === 'create') {
          await departmentApi.createDepartment(departmentForm)
          ElMessage.success('新增成功')
        } else {
          await departmentApi.updateDepartment(departmentForm.department_id, departmentForm)
          ElMessage.success('更新成功')
        }
        
        dialogVisible.value = false
        fetchDepartments() // 重新获取列表
      } catch (error) {
        if (error !== false) { // 排除表单验证失败的情况
          ElMessage.error(dialogType.value === 'create' ? '新增失败' : '更新失败')
          console.error(error)
        }
      }
    }
    
    // 分页相关
    const handleSizeChange = (size) => {
      pageSize.value = size
      fetchDepartments()
    }
    
    const handleCurrentChange = (current) => {
      currentPage.value = current
      fetchDepartments()
    }
    
    // 监听全局刷新事件
    const setupRefreshListener = () => {
      window.addEventListener('refresh-departments-data', fetchDepartments)
    }

    // 初始化
    onMounted(() => {
      fetchDepartments()
      fetchManagers()
      setupRefreshListener()
    })
    
    return {
      departments,
      currentPage,
      pageSize,
      total,
      searchForm,
      dialogVisible,
      dialogType,
      departmentFormRef,
      departmentForm,
      managers,
      rules,
      handleCreate,
      handleEdit,
      handleView,
      handleDelete,
      handleSubmit,
      handleSearch,
      resetSearch,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.department-list {
  padding: 20px;
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

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>