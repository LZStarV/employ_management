<template>
  <div class="department-detail">
    <el-card shadow="always">
      <template #header>
        <div class="card-header">
          <span>部门详情 - {{ department.department_name }}</span>
          <el-button @click="$router.back()">返回列表</el-button>
        </div>
      </template>

      <!-- 部门基本信息 -->
      <div class="basic-info">
        <h3>基本信息</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="部门ID">{{ department.department_id }}</el-descriptions-item>
              <el-descriptions-item label="部门名称">{{ department.department_name }}</el-descriptions-item>
              <el-descriptions-item label="部门经理">
                {{ department.departmentManager ? `${department.departmentManager.first_name} ${department.departmentManager.last_name}` : '未设置' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="办公地点">{{ department.location || '未设置' }}</el-descriptions-item>
              <el-descriptions-item label="员工数量">{{ department.stats ? department.stats.employeeCount : 0 }}人</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDate(department.created_at) }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>

      <!-- 部门员工列表 -->
      <div class="employee-list">
        <h3>部门员工列表</h3>
        
        <!-- 有员工时显示表格和分页 -->
        <div v-if="employees.length > 0 || loading">
          <el-table :data="employees" style="width: 100%" v-loading="loading">
            <el-table-column prop="employee_id" label="员工ID" width="80" />
            <el-table-column prop="first_name" label="姓氏" />
            <el-table-column prop="last_name" label="名字" />
            <el-table-column label="职位">
              <template #default="scope">
                {{ scope.row.position ? scope.row.position.position_name : '未设置' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusText(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hire_date" label="入职日期" width="120" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="primary" link size="small" @click="viewEmployee(scope.row.employee_id)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.limit"
              :page-sizes="[5, 10, 20, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
        
        <!-- 无员工时显示空状态 -->
        <div v-else class="no-data">
          <el-empty description="该部门暂无员工" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import departmentApi from '../api/departmentApi'

export default {
  name: 'DepartmentDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const department = ref({})
    const employees = ref([])
    const loading = ref(false)
    
    // 分页数据
    const pagination = reactive({
      page: 1,
      limit: 10,
      total: 0
    })

    // 获取部门详情
    const fetchDepartmentDetail = async () => {
      try {
        loading.value = true
        const response = await departmentApi.getDepartmentById(route.params.id)
        department.value = response.data
        // 获取部门员工列表
        await fetchDepartmentEmployees()
      } catch (error) {
        ElMessage.error('获取部门详情失败')
        console.error('获取部门详情失败:', error)
      } finally {
        loading.value = false
      }
    }

    // 获取部门员工列表
    const fetchDepartmentEmployees = async () => {
      try {
        const response = await departmentApi.getDepartmentEmployees(route.params.id, {
          page: pagination.page,
          limit: pagination.limit
        })
        employees.value = response.data
        pagination.total = response.pagination?.total || 0
      } catch (error) {
        ElMessage.error('获取部门员工列表失败')
        console.error('获取部门员工列表失败:', error)
      }
    }

    // 分页相关
    const handleSizeChange = (size) => {
      pagination.limit = size
      pagination.page = 1
      fetchDepartmentEmployees()
    }

    const handleCurrentChange = (current) => {
      pagination.page = current
      fetchDepartmentEmployees()
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleString('zh-CN')
    }

    // 获取状态对应的标签类型
    const getStatusType = (status) => {
      const statusMap = {
        active: 'success',
        resigned: 'danger',
        on_leave: 'warning',
        inactive: 'info'
      }
      return statusMap[status] || 'info'
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

    // 查看员工详情
    const viewEmployee = (employeeId) => {
      // 跳转到员工详情页面
      router.push(`/employees/${employeeId}`)
    }

    onMounted(() => {
      fetchDepartmentDetail()
    })

    return {
      department,
      employees,
      loading,
      pagination,
      formatDate,
      getStatusType,
      getStatusText,
      viewEmployee,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.department-detail {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.basic-info {
  margin-bottom: 30px;
}

.basic-info h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.employee-list {
  margin-top: 30px;
}

.employee-list h3 {
  margin-bottom: 15px;
  color: #409EFF;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.no-data {
  margin-top: 30px;
  text-align: center;
}
</style>