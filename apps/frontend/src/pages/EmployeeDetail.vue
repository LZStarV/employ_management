<template>
  <div class="employee-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <el-button type="primary" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <h2 style="margin-left: 20px;">员工详情</h2>
        </div>
      </template>

      <div v-loading="loading">
        <!-- 基本信息卡片 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
              <el-button type="warning" @click="editEmployee">
                <el-icon><Edit /></el-icon>
                编辑信息
              </el-button>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>姓名：</label>
                <span>{{ employeeData?.first_name }} {{ employeeData?.last_name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>员工ID：</label>
                <span>{{ employeeData?.employee_id }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>邮箱：</label>
                <span>{{ employeeData?.email }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>电话：</label>
                <span>{{ employeeData?.phone }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>部门：</label>
                <span>{{ employeeData?.department?.department_name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>职位：</label>
                <span>{{ employeeData?.position?.position_name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>入职日期：</label>
                <span>{{ employeeData?.hire_date }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>状态：</label>
                <el-tag :type="getStatusTagType(employeeData?.status)">
                  {{ getStatusText(employeeData?.status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>直接上级：</label>
                <span>{{ employeeData?.manager ? `${employeeData.manager.first_name} ${employeeData.manager.last_name}` : '无' }}</span>
              </div>
            </el-col>
          </el-row>
          <div class="info-item full-width">
            <label>地址：</label>
            <span>{{ employeeData?.address || '未设置' }}</span>
          </div>
        </el-card>

        <!-- 薪资信息卡片 -->
        <el-card class="info-card" shadow="hover" v-if="employeeData?.salary">
          <template #header>
            <div class="card-header">
              <span>薪资信息</span>
              <el-button type="primary" @click="showSalaryDialog">
                <el-icon><EditPen /></el-icon>
                调整薪资
              </el-button>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="salary-item">
                <label>基本工资：</label>
                <span class="salary-amount">¥{{ formatNumber(employeeData?.salary?.basic_salary) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="salary-item">
                <label>奖金：</label>
                <span class="salary-amount">¥{{ formatNumber(employeeData?.salary?.bonus) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="salary-item">
                <label>津贴：</label>
                <span class="salary-amount">¥{{ formatNumber(employeeData?.salary?.allowances) }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="salary-item">
                <label>总薪资：</label>
                <span class="salary-amount total">¥{{ formatNumber(getTotalSalary()) }}</span>
              </div>
            </el-col>
          </el-row>
          <div class="info-item">
            <label>生效日期：</label>
            <span>{{ employeeData?.salary?.effective_date }}</span>
          </div>
        </el-card>

        <!-- 项目经历标签页 -->
        <el-card class="info-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目经历</span>
            </div>
          </template>
          <el-table
            :data="projectsData"
            style="width: 100%"
            border
          >
            <el-table-column prop="project_name" label="项目名称" width="200" />
            <el-table-column prop="role" label="担任角色" width="120" />
            <el-table-column prop="start_date" label="开始日期" width="120" />
            <el-table-column prop="end_date" label="结束日期" width="120">
              <template #default="scope">
                {{ scope.row.end_date || '进行中' }}
              </template>
            </el-table-column>
            <el-table-column prop="contribution_hours" label="贡献工时" width="100" />
            <el-table-column prop="description" label="项目描述" />
          </el-table>
        </el-card>
      </div>
    </el-card>

    <!-- 薪资调整对话框 -->
    <el-dialog
      v-model="salaryDialogVisible"
      title="薪资调整"
      width="50%"
    >
      <el-form
        ref="salaryFormRef"
        :model="salaryForm"
        :rules="salaryRules"
        label-width="120px"
      >
        <el-form-item label="基本工资" prop="basic_salary">
          <el-input-number
            v-model="salaryForm.basic_salary"
            :min="0"
            :step="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="奖金" prop="bonus">
          <el-input-number
            v-model="salaryForm.bonus"
            :min="0"
            :step="50"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="津贴" prop="allowances">
          <el-input-number
            v-model="salaryForm.allowances"
            :min="0"
            :step="50"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="生效日期" prop="effective_date">
          <el-date-picker
            v-model="salaryForm.effective_date"
            type="date"
            placeholder="选择生效日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="salaryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveSalary">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 员工编辑对话框组件 -->
    <EmployeeEditDialog
      v-model="editDialogVisible"
      :employee-data="employeeData"
      :departments="departments"
      :positions="positions"
      :is-edit-mode="true"
      @saved="handleEmployeeSaved"
    />
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Edit, EditPen } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import employeeApi from '../api/employeeApi'
import departmentApi from '../api/departmentApi'
import positionApi from '../api/positionApi'
import EmployeeEditDialog from '../components/EmployeeEditDialog.vue'

export default {
  name: 'EmployeeDetail',
  components: {
    ArrowLeft,
    Edit,
    EditPen,
    EmployeeEditDialog
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()
    const route = useRoute()
    const loading = ref(false)
    const salaryDialogVisible = ref(false)
    const salaryFormRef = ref(null)
    const editDialogVisible = ref(false)
    
    const employeeData = ref(null)
    const projectsData = ref([])
    const departments = ref([])
    const positions = ref([])
    
    // 薪资表单
    const salaryForm = reactive({
      basic_salary: 0,
      bonus: 0,
      allowances: 0,
      effective_date: ''
    })
    
    // 薪资表单验证规则
    const salaryRules = {
      basic_salary: [
        { required: true, message: '请输入基本工资', trigger: 'blur' },
        { type: 'number', min: 0, message: '基本工资不能为负数', trigger: 'blur' }
      ],
      effective_date: [
        { required: true, message: '请选择生效日期', trigger: 'change' }
      ]
    }
    
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
    
    // 获取员工详情
    const getEmployeeDetail = async () => {
      loading.value = true
      try {
        const employeeId = props.id || route.params.id
        
        // 调用API获取员工详情
        const response = await employeeApi.getEmployeeById(employeeId)
        employeeData.value = response.data
        
        // 获取项目数据
        await getEmployeeProjects(employeeId)
      } catch (error) {
        ElMessage.error('获取员工详情失败')
        router.push('/employees')
      } finally {
        loading.value = false
      }
    }
    
    // 获取员工项目
    const getEmployeeProjects = async (employeeId) => {
      try {
        // 调用API获取员工项目
        const response = await employeeApi.getEmployeeProjects(employeeId)
        projectsData.value = response.data
      } catch (error) {
        ElMessage.error('获取项目信息失败')
      }
    }
    
    // 显示薪资调整对话框
    const showSalaryDialog = () => {
      if (employeeData.value?.salary) {
        Object.assign(salaryForm, {
          basic_salary: parseFloat(employeeData.value.salary.basic_salary) || 0,
          bonus: parseFloat(employeeData.value.salary.bonus) || 0,
          allowances: parseFloat(employeeData.value.salary.allowances) || 0,
          effective_date: new Date().toISOString().split('T')[0]
        })
      }
      salaryDialogVisible.value = true
    }
    
    // 保存薪资调整
    const saveSalary = async () => {
      try {
        await salaryFormRef.value.validate()
        
        // 调用API调整薪资
        await employeeApi.adjustSalary(props.id, salaryForm)
        
        // 重新获取员工详情以更新数据
        await getEmployeeDetail()
        
        ElMessage.success('薪资调整成功')
        salaryDialogVisible.value = false
      } catch (error) {
        // 表单验证失败
      }
    }
    
    // 编辑员工信息
    const editEmployee = () => {
      editDialogVisible.value = true
    }
    
    // 处理编辑组件保存后的回调
    const handleEmployeeSaved = () => {
      getEmployeeDetail()
    }
    
    // 返回列表
    const goBack = () => {
      router.back()
    }
    
    // 计算总薪资
    const getTotalSalary = () => {
      if (!employeeData.value?.salary) return 0
      const { basic_salary, bonus, allowances } = employeeData.value.salary
      return (parseFloat(basic_salary) || 0) + (parseFloat(bonus) || 0) + (parseFloat(allowances) || 0)
    }
    
    // 格式化数字
    const formatNumber = (num) => {
      if (num === null || num === undefined) return '0.00'
      const numberValue = typeof num === 'string' ? parseFloat(num) : num
      if (isNaN(numberValue)) return '0.00'
      return numberValue.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
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
      return typeMap[status] || 'info'
    }
    
    // 监听ID变化，重新获取数据
    watch(() => props.id, (newId) => {
      if (newId) {
        getEmployeeDetail()
      }
    })
    
    // 页面加载时获取数据
    onMounted(() => {
      getDepartments()
      getPositions()
      getEmployeeDetail()
    })
    
    return {
      loading,
      salaryDialogVisible,
      salaryFormRef,
      editDialogVisible,
      employeeData,
      projectsData,
      departments,
      positions,
      salaryForm,
      salaryRules,
      showSalaryDialog,
      saveSalary,
      editEmployee,
      handleEmployeeSaved,
      goBack,
      getTotalSalary,
      formatNumber,
      getStatusText,
      getStatusTagType
    }
  }
}
</script>

<style scoped>
.employee-detail-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-card {
  margin-bottom: 20px;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.info-item.full-width {
  width: 100%;
}

.info-item label {
  font-weight: bold;
  min-width: 100px;
  color: #606266;
}

.salary-item {
  margin-bottom: 20px;
}

.salary-item label {
  font-weight: bold;
  color: #606266;
  display: block;
  margin-bottom: 5px;
}

.salary-amount {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.salary-amount.total {
  color: #f56c6c;
  font-size: 24px;
}
</style>